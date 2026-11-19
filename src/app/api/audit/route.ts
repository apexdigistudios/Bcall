import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { generateAuditReport } from "@/lib/audit/engine";
import { validateAuditSubmission } from "@/lib/audit/validation";
import type { AuditReport } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestLimitBytes = 16_384;
const rateWindows = new Map<string, { count: number; resetAt: number }>();

type RequestError = Error & { status: number; code: string };

function requestError(code: string, message: string, status: number): RequestError {
  return Object.assign(new Error(message), { code, status });
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw requestError("UNSUPPORTED_CONTENT_TYPE", "Send the audit form as JSON.", 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > requestLimitBytes) {
    throw requestError("REQUEST_TOO_LARGE", "The submitted form is too large.", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw requestError("EMPTY_REQUEST", "The submitted form was empty.", 400);
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > requestLimitBytes) {
      await reader.cancel();
      throw requestError("REQUEST_TOO_LARGE", "The submitted form is too large.", 413);
    }
    chunks.push(value);
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch (error) {
    if (error instanceof Error && "code" in error) throw error;
    throw requestError("INVALID_JSON", "We couldn't read the submitted form. Please try again.", 400);
  }
}

function rateLimit(request: Request, email: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateWindows.size > 5_000) {
    for (const [key, entry] of rateWindows) {
      if (entry.resetAt <= now) rateWindows.delete(key);
    }
  }

  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedIp || request.headers.get("x-real-ip")?.trim() || "unknown";
  const checks: Array<{ key: string; limit: number; windowMs: number }> = [
    { key: `ip:${clientIp}`, limit: 10, windowMs: 10 * 60 * 1000 },
    { key: `email:${email}`, limit: 4, windowMs: 60 * 60 * 1000 },
  ];

  for (const check of checks) {
    const current = rateWindows.get(check.key);
    if (current && current.resetAt > now && current.count >= check.limit) {
      return { limited: true, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
    }
  }

  for (const check of checks) {
    const current = rateWindows.get(check.key);
    if (!current || current.resetAt <= now) {
      rateWindows.set(check.key, { count: 1, resetAt: now + check.windowMs });
    } else {
      current.count += 1;
    }
  }
  return { limited: false, retryAfter: 0 };
}

function jsonError(
  code: string,
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
  requestId?: string,
) {
  return Response.json(
    { error: message, code, ...(requestId ? { requestId } : {}), ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getDatabaseErrorCode(error: unknown): string | undefined {
  const visited = new Set<object>();
  let current = error;
  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    if ("code" in current && typeof current.code === "string" && /^[A-Z0-9]{5}$|^E[A-Z]+$/.test(current.code)) {
      return current.code;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

function databaseFailure(error: unknown, requestId: string, stage: string) {
  const databaseCode = getDatabaseErrorCode(error);
  let code = "AUDIT_STORAGE_FAILED";
  let message = "Audit storage is temporarily unavailable. Please try again later.";

  if (databaseCode === "42P01") {
    code = "AUDIT_TABLE_MISSING";
    message = "Audit storage is not set up. Apply the audit_reports database migration before trying again.";
  } else if (databaseCode === "42703") {
    code = "AUDIT_SCHEMA_MISMATCH";
    message = "Audit storage schema is out of date. Apply the latest database schema before trying again.";
  } else if (databaseCode === "42501") {
    code = "AUDIT_DATABASE_PERMISSION_DENIED";
    message = "Audit storage cannot read or save reports. Check the database role and table permissions.";
  } else if (
    databaseCode === "28P01" ||
    databaseCode === "3D000" ||
    databaseCode === "ENOTFOUND" ||
    databaseCode === "ECONNREFUSED"
  ) {
    code = "AUDIT_DATABASE_CONFIGURATION";
    message = "Audit storage could not connect. Verify the server-side database connection settings.";
  } else if (databaseCode?.startsWith("08") || databaseCode === "ETIMEDOUT") {
    code = "AUDIT_DATABASE_UNAVAILABLE";
    message = "Audit storage could not be reached. Check the database service and network connection.";
  }

  console.error(JSON.stringify({
    event: "audit.request_failed",
    requestId,
    status: 503,
    code,
    stage,
    databaseCode,
    errorName: error instanceof Error ? error.name : "UnknownError",
  }));
  return jsonError(code, message, 503, {}, requestId);
}

function generationFailure(error: unknown, requestId: string) {
  console.error(JSON.stringify({
    event: "audit.request_failed",
    requestId,
    status: 500,
    code: "AUDIT_GENERATION_FAILED",
    stage: "report_generation",
    errorName: error instanceof Error ? error.name : "UnknownError",
  }));
  return jsonError(
    "AUDIT_GENERATION_FAILED",
    "We couldn't generate your audit. No report was saved. Please try again.",
    500,
    {},
    requestId,
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 400;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "INVALID_REQUEST";
    return jsonError(code, error instanceof Error ? error.message : "The submitted form could not be read.", status, {}, requestId);
  }

  const validation = validateAuditSubmission(body);
  if (!validation.valid) {
    return jsonError("INVALID_SUBMISSION", "Please check the highlighted fields.", 400, { fieldErrors: validation.fieldErrors }, requestId);
  }

  const idempotencyKey = body && typeof body === "object" && "idempotencyKey" in body
    ? body.idempotencyKey
    : null;
  if (typeof idempotencyKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return jsonError("INVALID_IDEMPOTENCY_KEY", "This audit request could not be verified. Please refresh the page and try again.", 400, {}, requestId);
  }
  const limit = rateLimit(request, validation.data.businessEmail);
  if (limit.limited) {
    return jsonError("RATE_LIMITED", "Too many audit requests. Please try again later.", 429, { retryAfter: limit.retryAfter }, requestId);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(JSON.stringify({
      event: "audit.request_failed",
      requestId,
      status: 503,
      code: "DATABASE_URL_MISSING",
      stage: "configuration",
      message: "DATABASE_URL is not configured",
    }));
    return jsonError(
      "DATABASE_URL_MISSING",
      "Audit storage is not configured. Set the server-side DATABASE_URL before generating reports.",
      503,
      {},
      requestId,
    );
  }

  let db: typeof import("@/db").db;
  let auditReports: typeof import("@/db/schema").auditReports;
  try {
    [{ db }, { auditReports }] = await Promise.all([import("@/db"), import("@/db/schema")]);
    const [existing] = await db.select({ report: auditReports.report })
      .from(auditReports)
      .where(eq(auditReports.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) return Response.json({ report: existing.report }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseFailure(error, requestId, "storage_read_or_initialization");
  }

  let report: AuditReport;
  try {
    report = await generateAuditReport(validation.data);
  } catch (error) {
    return generationFailure(error, requestId);
  }

  try {
    await db.insert(auditReports).values({
      idempotencyKey,
      businessName: validation.data.businessName,
      websiteUrl: validation.data.websiteUrl || null,
      googleBusinessProfileUrl: validation.data.googleBusinessProfileUrl || null,
      businessType: validation.data.businessType,
      monthlyCallsRange: validation.data.monthlyCallsRange,
      missedCallsRange: validation.data.missedCallsRange,
      averageJobValueRange: validation.data.averageJobValueRange,
      businessEmail: validation.data.businessEmail,
      report,
    });
  } catch (insertError) {
    try {
      const [concurrentReport] = await db.select({ report: auditReports.report })
        .from(auditReports)
        .where(eq(auditReports.idempotencyKey, idempotencyKey))
        .limit(1);
      if (concurrentReport) return Response.json({ report: concurrentReport.report }, { headers: { "Cache-Control": "no-store" } });
    } catch (readError) {
      return databaseFailure(readError, requestId, "idempotency_recovery_read");
    }

    return databaseFailure(insertError, requestId, "storage_write");
  }
  return Response.json({ report }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
