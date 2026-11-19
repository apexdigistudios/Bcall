import { eq } from "drizzle-orm";
import { generateAuditReport } from "@/lib/audit/engine";
import { validateAuditSubmission } from "@/lib/audit/validation";
import type { AuditReport } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestLimitBytes = 16_384;
const rateWindows = new Map<string, { count: number; resetAt: number }>();

async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw Object.assign(new Error("Send the audit form as JSON."), { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > requestLimitBytes) {
    throw Object.assign(new Error("The submitted form is too large."), { status: 413 });
  }

  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error("The submitted form was empty."), { status: 400 });
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > requestLimitBytes) {
      await reader.cancel();
      throw Object.assign(new Error("The submitted form is too large."), { status: 413 });
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
  } catch {
    throw Object.assign(new Error("We couldn't read the submitted form. Please try again."), { status: 400 });
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

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 400;
    return jsonError(error instanceof Error ? error.message : "The submitted form could not be read.", status);
  }

  const validation = validateAuditSubmission(body);
  if (!validation.valid) {
    return jsonError("Please check the highlighted fields.", 400, { fieldErrors: validation.fieldErrors });
  }

  const idempotencyKey = body && typeof body === "object" && "idempotencyKey" in body
    ? body.idempotencyKey
    : null;
  if (typeof idempotencyKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return jsonError("This audit request could not be verified. Please refresh the page and try again.", 400);
  }
  const limit = rateLimit(request, validation.data.businessEmail);
  if (limit.limited) {
    return jsonError("Too many audit requests. Please try again later.", 429, { retryAfter: limit.retryAfter });
  }
  if (!process.env.DATABASE_URL) {
    console.error("Yello audit submission unavailable: DATABASE_URL is not configured");
    return jsonError("Audit storage is currently unavailable. No report was generated. Please try again later.", 503);
  }

  try {
    const [{ db }, { auditReports }] = await Promise.all([import("@/db"), import("@/db/schema")]);
    const [existing] = await db.select({ report: auditReports.report })
      .from(auditReports)
      .where(eq(auditReports.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) return Response.json({ report: existing.report }, { headers: { "Cache-Control": "no-store" } });

    const report = await generateAuditReport(validation.data);
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
      const [concurrentReport] = await db.select({ report: auditReports.report })
        .from(auditReports)
        .where(eq(auditReports.idempotencyKey, idempotencyKey))
        .limit(1);
      if (concurrentReport) return Response.json({ report: concurrentReport.report }, { headers: { "Cache-Control": "no-store" } });
      throw insertError;
    }

    return Response.json({ report: report as AuditReport }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Yello audit generation or storage failed", { name: error instanceof Error ? error.name : "AuditError" });
    return jsonError("We couldn't save your audit, so no report is available. Please try again in a moment.", 503);
  }
}
