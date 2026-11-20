import { randomUUID } from "node:crypto";
import { auditInputSchema } from "@/lib/schema";
import { auditWebsite, type WebsiteAudit } from "@/lib/website";
import { auditOpenStreetMap, type OsmAudit } from "@/lib/osm";
import { buildAuditReport } from "@/lib/report";
import { generateAuditDiagnosis } from "@/lib/diagnosis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestLimitBytes = 16_384;
const requestsByIp = new Map<string, { count: number; resetAt: number }>();
const maxRequestsPerHour = 5;
const rateWindowMs = 60 * 60 * 1_000;

function errorResponse(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, code, ...extra }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  for (const [ip, entry] of requestsByIp) {
    if (entry.resetAt <= now) requestsByIp.delete(ip);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? "unknown";
  const entry = requestsByIp.get(ip);
  if (entry && entry.resetAt > now && entry.count >= maxRequestsPerHour) return true;
  if (!entry || entry.resetAt <= now) requestsByIp.set(ip, { count: 1, resetAt: now + rateWindowMs });
  else entry.count += 1;
  return false;
}

function unavailableWebsite(url: string): WebsiteAudit {
  return {
    status: "unavailable",
    url,
    phone: null,
    checks: [],
    message: "The public website check could not be completed. No website loss was assigned.",
  };
}

function unavailableOsm(): OsmAudit {
  return {
    status: "unavailable",
    message: "The OpenStreetMap lookup could not be completed. No listing details were assumed.",
  };
}

async function readJsonBody(request: Request): Promise<{ value?: unknown; error?: Response }> {
  const reader = request.body?.getReader();
  if (!reader) return { error: errorResponse("EMPTY_REQUEST", "The submitted form was empty.", 400) };
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > requestLimitBytes) {
        await reader.cancel();
        return { error: errorResponse("REQUEST_TOO_LARGE", "The submitted form is too large.", 413) };
      }
      chunks.push(value);
    }
  } catch {
    return { error: errorResponse("REQUEST_READ_FAILED", "We couldn't read the submitted form. Please try again.", 400) };
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { error: errorResponse("INVALID_JSON", "We couldn't read the submitted form. Please try again.", 400) };
  }
}

function comparePhone(osm: OsmAudit, website: WebsiteAudit): OsmAudit {
  if (osm.status !== "found" || !osm.phone || !website.phone) return osm;
  const osmDigits = osm.phone.replace(/\D/g, "");
  const siteDigits = website.phone.replace(/\D/g, "");
  return { ...osm, phoneMatchesWebsite: osmDigits === siteDigits };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return errorResponse("UNSUPPORTED_CONTENT_TYPE", "Send the audit form as JSON.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > requestLimitBytes) {
    return errorResponse("REQUEST_TOO_LARGE", "The submitted form is too large.", 413);
  }
  if (isRateLimited(request)) {
    return errorResponse("RATE_LIMITED", "Too many audits from this connection. Try again in about an hour.", 429);
  }

  const bodyResult = await readJsonBody(request);
  if (bodyResult.error) return bodyResult.error;

  const parsed = auditInputSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
    );
    return errorResponse("INVALID_INPUT", "Please check the highlighted fields.", 400, { fieldErrors });
  }

  try {
    const [websiteResult, osmResult] = await Promise.allSettled([
      auditWebsite(parsed.data.websiteUrl),
      auditOpenStreetMap(parsed.data, { phone: null, url: parsed.data.websiteUrl }),
    ]);
    if (websiteResult.status === "rejected") {
      console.warn(JSON.stringify({
        event: "audit.module_failed",
        requestId,
        module: "website",
        errorName: websiteResult.reason instanceof Error ? websiteResult.reason.name : "UnknownError",
      }));
    }
    if (osmResult.status === "rejected") {
      console.warn(JSON.stringify({
        event: "audit.module_failed",
        requestId,
        module: "openstreetmap",
        errorName: osmResult.reason instanceof Error ? osmResult.reason.name : "UnknownError",
      }));
    }
    const website = websiteResult.status === "fulfilled"
      ? websiteResult.value
      : unavailableWebsite(parsed.data.websiteUrl);
    const openStreetMap = comparePhone(
      osmResult.status === "fulfilled" ? osmResult.value : unavailableOsm(),
      website,
    );

    const deterministicReport = buildAuditReport(parsed.data, website, openStreetMap);
    const diagnosis = await generateAuditDiagnosis(
      parsed.data,
      website,
      openStreetMap,
      deterministicReport,
      requestId,
    );
    const report = { ...deterministicReport, diagnosis };
    return Response.json({ report }, {
      status: 200,
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "audit.failed",
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    return errorResponse("AUDIT_FAILED", "We couldn't prepare this audit. Please try again.", 500, { requestId });
  }
}
