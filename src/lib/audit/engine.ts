import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupAddress } from "node:dns";
import type {
  AuditFinding,
  AuditFormData,
  AuditReport,
  AuditSection,
  AuditStatus,
} from "./types";
import { normalizeAuditUrl } from "./validation";

const assumedConversionRate = 0.1;
const pageTimeoutMs = 5_000;
const maxPageBytes = 350_000;

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b, c] = octets;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function ipv6ToBigInt(address: string): bigint | null {
  let input = address.toLowerCase().split("%")[0];
  if (input.includes(".")) {
    const lastColon = input.lastIndexOf(":");
    const ipv4 = input.slice(lastColon + 1);
    if (!isPublicIpv4(ipv4)) return null;
    const octets = ipv4.split(".").map(Number);
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    input = `${input.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = input.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((part) => !/^[\da-f]{1,4}$/.test(part))) return null;
  return groups.reduce((value, part) => (value << BigInt(16)) | BigInt(`0x${part}`), BigInt(0));
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family !== 6) return false;

  const value = ipv6ToBigInt(address);
  if (value === null) return false;
  const firstHextet = Number((value >> BigInt(112)) & BigInt(0xffff));
  if (firstHextet < 0x2000 || firstHextet > 0x3fff) return false;

  const secondHextet = Number((value >> BigInt(96)) & BigInt(0xffff));
  if (firstHextet === 0x2001 && secondHextet <= 0x01ff) return false;
  if (firstHextet === 0x2001 && secondHextet === 0x0db8) return false;
  if (firstHextet === 0x2002) return false;
  return true;
}

async function resolvePublicHost(hostname: string): Promise<LookupAddress> {
  const bareHostname = hostname.replace(/^\[|\]$/g, "");
  const family = isIP(bareHostname);
  if (family) {
    if (!isPublicAddress(bareHostname)) throw new Error("Non-public address");
    return { address: bareHostname, family };
  }

  const addresses = await lookup(bareHostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Non-public address");
  }
  return addresses[0];
}

type PageResponse = { status: number; body: string; contentType: string; location: string | null };

async function requestPublicPage(url: URL): Promise<PageResponse> {
  const resolved = await resolvePublicHost(url.hostname);
  const transport = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise<PageResponse>((resolve, reject) => {
    let settled = false;
    let totalBytes = 0;
    const chunks: Buffer[] = [];
    const finish = (error?: Error, result?: PageResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else if (result) resolve(result);
      else reject(new Error("Empty website response"));
    };

    const request = transport(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Encoding": "identity",
        "User-Agent": "YellloPublicAudit/1.0",
      },
      lookup: (_hostname, options, callback) => {
        if (typeof options === "object" && options.all) {
          callback(null, [{ address: resolved.address, family: resolved.family }]);
        } else {
          callback(null, resolved.address, resolved.family);
        }
      },
    }, (response) => {
      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.byteLength;
        if (totalBytes > maxPageBytes) {
          response.destroy(new Error("Page exceeds scan limit"));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => finish(undefined, {
        status: response.statusCode ?? 0,
        body: Buffer.concat(chunks).toString("utf8"),
        contentType: response.headers["content-type"] ?? "",
        location: response.headers.location ?? null,
      }));
      response.on("error", (error) => finish(error));
    });

    const timer = setTimeout(() => request.destroy(new Error("Website inspection timed out")), pageTimeoutMs);
    request.on("error", (error) => finish(error));
    request.end();
  });
}

async function fetchPublicHtml(inputUrl: string): Promise<{ url: URL; response: PageResponse }> {
  let url = new URL(inputUrl);
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const safeUrl = normalizeAuditUrl(url.toString());
    if (!safeUrl) throw new Error("Unsafe website URL");
    url = new URL(safeUrl);
    const response = await requestPublicPage(url);
    if ([301, 302, 303, 307, 308].includes(response.status) && response.location && redirects < 2) {
      url = new URL(response.location, url);
      continue;
    }
    return { url, response };
  }
  throw new Error("Too many redirects");
}

function representativeCalls(range: AuditFormData["monthlyCallsRange"]): number {
  switch (range) {
    case "Under 50": return 25;
    case "50–100": return 75;
    case "100–250": return 175;
    case "250–500": return 375;
    case "500+": return 550;
    default: return 0;
  }
}

function representativeMissRate(range: AuditFormData["missedCallsRange"]): number | null {
  switch (range) {
    case "Under 5%": return 0.025;
    case "5–10%": return 0.075;
    case "10–25%": return 0.175;
    case "25–40%": return 0.325;
    case "Over 40%": return 0.45;
    default: return null;
  }
}

function representativeJobValue(range: AuditFormData["averageJobValueRange"]): number {
  switch (range) {
    case "Under $500": return 250;
    case "$500–$1,500": return 1_000;
    case "$1,500–$5,000": return 3_250;
    case "$5,000–$10,000": return 7_500;
    case "$10,000+": return 10_000;
    default: return 0;
  }
}

function cleanVisibleText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ");
}

function finding(label: string, status: AuditStatus, detail: string): AuditFinding {
  return { label, status, detail };
}

function statusFromFindings(findings: AuditFinding[]): AuditStatus {
  const verifiable = findings.filter((item) => item.status !== "Unable to verify");
  if (!verifiable.length) return "Unable to verify";
  const improvements = verifiable.filter((item) => item.status === "Needs improvement" || item.status === "Critical").length;
  return improvements === 0 ? "Good" : "Needs improvement";
}

async function inspectWebsite(websiteUrl: string): Promise<{
  section: AuditSection;
  recommendations: AuditReport["recommendations"];
}> {
  if (!websiteUrl) {
    return {
      section: {
        id: "website",
        title: "Website audit",
        status: "Unable to verify",
        summary: "No website URL was provided, so a public homepage check was not run.",
        findings: [finding("Homepage access", "Unable to verify", "Add a public website URL to check its homepage.")],
      },
      recommendations: [],
    };
  }

  let page: Awaited<ReturnType<typeof fetchPublicHtml>>;
  try {
    page = await fetchPublicHtml(websiteUrl);
  } catch {
    return {
      section: {
        id: "website",
        title: "Website audit",
        status: "Unable to verify",
        summary: "The public homepage could not be safely reached during this check. No conclusion was drawn about the rest of the site.",
        findings: [finding("Homepage access", "Unable to verify", "The page was unreachable, blocked, redirected to an unsafe address, timed out, or exceeded the scan limit.")],
      },
      recommendations: [{
        priority: "High",
        title: "Check that your website loads reliably",
        detail: "Open the public homepage on a phone and confirm visitors can reach your contact details without errors.",
      }],
    };
  }

  const { url, response } = page;
  if (response.status < 200 || response.status >= 300 || !/html/i.test(response.contentType)) {
    return {
      section: {
        id: "website",
        title: "Website audit",
        status: "Unable to verify",
        summary: `The homepage returned HTTP ${response.status || "an unsupported response"} or did not return HTML, so page-level cues could not be checked.`,
        findings: [finding("Homepage access", "Unable to verify", "Only a public HTML homepage can be inspected by this limited check.")],
      },
      recommendations: [{
        priority: "High",
        title: "Check your public homepage response",
        detail: "Confirm the main business URL loads a public HTML page without a sign-in or bot challenge.",
      }],
    };
  }

  const html = response.body;
  const visibleText = cleanVisibleText(html);
  const hasViewport = /<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*content\s*=\s*["'][^"']*width\s*=\s*device-width/i.test(html);
  const hasResponsiveCue = hasViewport || /@media\s*\(|\b(?:sm|md|lg|xl):(?:flex|grid|block|hidden|w-|grid-cols-)/i.test(html);
  const hasPhone = /href\s*=\s*["']tel:/i.test(html) || /(?:\+?\d[\d\s().-]{6,}\d)/.test(visibleText);
  const hasContactForm = /<form\b/i.test(html) || /\b(contact|appointment|booking|schedule)\b/i.test(visibleText);
  const hasContactAction = /<(?:a|button)\b[^>]*(?:href\s*=\s*["']tel:|>[^<]*(?:contact|call|book|schedule|quote))/i.test(html);
  const checks = [
    finding("Homepage access", "Good", `The homepage returned HTTP ${response.status}. This is a one-page public check.`),
    finding("HTTPS", url.protocol === "https:" ? "Good" : "Needs improvement", url.protocol === "https:" ? "The final homepage URL uses HTTPS." : "The final homepage URL uses HTTP rather than HTTPS."),
    finding("Mobile cue", hasResponsiveCue ? "Good" : "Needs improvement", hasResponsiveCue ? "A viewport or responsive-layout cue was found in the homepage HTML." : "No mobile viewport or responsive-layout cue was found in the homepage HTML snapshot."),
    finding("Visible phone", hasPhone ? "Good" : "Needs improvement", hasPhone ? "A phone link or phone-like number was found in homepage text." : "No phone link or phone-like number was found in the homepage text snapshot."),
    finding("Contact or booking path", hasContactForm ? "Good" : "Needs improvement", hasContactForm ? "A form or contact/booking cue was found in the homepage snapshot." : "No form or contact/booking cue was found in the homepage snapshot."),
    finding("Contact action", hasContactAction ? "Good" : "Needs improvement", hasContactAction ? "A contact, call, booking, schedule, quote, or telephone action was found in the homepage markup." : "No prominent contact or booking action cue was found in the homepage markup."),
  ];

  const recommendations: AuditReport["recommendations"] = [];
  if (!hasContactAction) recommendations.push({
    priority: "High",
    title: "Make the next step easy to find",
    detail: "Add a clear call, contact, or booking action near the top of your homepage.",
  });
  if (!hasPhone) recommendations.push({
    priority: "High",
    title: "Make your phone number easy to reach",
    detail: "Show a tappable phone number where mobile visitors can quickly find it.",
  });
  if (!hasContactForm) recommendations.push({
    priority: "Medium",
    title: "Offer a second way to enquire",
    detail: "Consider a short contact or booking route for visitors who cannot call right away.",
  });
  if (!hasResponsiveCue) recommendations.push({
    priority: "Medium",
    title: "Review the mobile experience",
    detail: "Check that your homepage and contact actions remain clear on a small screen.",
  });

  return {
    section: {
      id: "website",
      title: "Website audit",
      status: statusFromFindings(checks),
      summary: "A limited, server-side snapshot of the public homepage was checked. This is not a full-site or visual usability test.",
      findings: checks,
    },
    recommendations,
  };
}

function missedCallSection(input: AuditFormData, missedCalls: number | null, representativeMonthlyCalls: number): AuditSection {
  const status: AuditStatus = input.missedCallsRange === "I don't know"
    ? "Unable to verify"
    : input.missedCallsRange === "25–40%" || input.missedCallsRange === "Over 40%"
      ? "Critical"
      : input.missedCallsRange === "10–25%"
        ? "Needs improvement"
        : "Good";

  return {
    id: "missed-call-revenue",
    title: "Missed-call revenue audit",
    status,
    summary: input.missedCallsRange === "I don't know"
      ? "A revenue opportunity was not estimated because the missed-call percentage is unknown."
      : `Using representative values for ${input.monthlyCallsRange} monthly calls and ${input.missedCallsRange} missed calls.`,
    findings: [
      finding("Monthly call volume", "Unable to verify", `${representativeMonthlyCalls} calls per month is the representative value used for your self-reported ${input.monthlyCallsRange} range; it is not measured call data.`),
      finding("Missed-call rate", input.missedCallsRange === "I don't know" ? "Unable to verify" : status, input.missedCallsRange === "I don't know" ? "No missed-call percentage was supplied, so missed-call and revenue estimates are omitted." : `The selected ${input.missedCallsRange} range is represented by its midpoint (or a conservative floor proxy for an open-ended range).`),
      finding("Average job value", "Unable to verify", `A representative value of $${representativeJobValue(input.averageJobValueRange).toLocaleString("en-US")} is used from your self-reported ${input.averageJobValueRange} range; it is not verified.`),
      finding("Potential monthly opportunity", missedCalls === null ? "Unable to verify" : "Needs improvement", missedCalls === null ? "Unable to estimate without a missed-call rate." : "Estimate applies a disclosed 10% conversion assumption to estimated missed calls and the representative job value. It is not a verified financial loss."),
    ],
  };
}

function buildRecommendations(
  websiteRecommendations: AuditReport["recommendations"],
  input: AuditFormData,
): AuditReport["recommendations"] {
  const recommendations = [...websiteRecommendations];
  if (input.missedCallsRange === "I don't know") {
    recommendations.push({
      priority: "High",
      title: "Start measuring unanswered enquiries",
      detail: "Track incoming calls and missed calls for a few weeks to replace the unknown rate with your own operating data.",
    });
  } else if (input.missedCallsRange === "25–40%" || input.missedCallsRange === "Over 40%") {
    recommendations.push({
      priority: "High",
      title: "Create a consistent missed-call follow-up process",
      detail: "Your selected range suggests many calls may go unanswered. Measure call outcomes and decide who follows up, and how quickly.",
    });
  } else {
    recommendations.push({
      priority: "Medium",
      title: "Keep a clear record of every enquiry",
      detail: "Use a simple process to track missed calls, follow-up attempts, and whether an enquiry became a booked job.",
    });
  }
  recommendations.push({
    priority: "Medium",
    title: "Manually verify your Google Business Profile",
    detail: "Check the live profile for accurate hours, phone number, service areas, and a working website link.",
  });
  if (recommendations.length < 3) {
    recommendations.push({
      priority: "Medium",
      title: "Make contact options easy to find",
      detail: "Check that callers and website visitors can quickly see how to reach your team.",
    });
  }
  return recommendations
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "High" ? -1 : 1))
    .slice(0, 3);
}

export async function generateAuditReport(input: AuditFormData, auditDate = new Date()): Promise<AuditReport> {
  const representativeMonthlyCalls = representativeCalls(input.monthlyCallsRange);
  const representativeMissRateValue = representativeMissRate(input.missedCallsRange);
  const estimatedMonthlyMissedCalls = representativeMissRateValue === null
    ? null
    : Math.round(representativeMonthlyCalls * representativeMissRateValue * 10) / 10;
  const representativeAverageJobValue = representativeJobValue(input.averageJobValueRange);
  const estimatedMonthlyOpportunity = estimatedMonthlyMissedCalls === null
    ? null
    : Math.round(estimatedMonthlyMissedCalls * assumedConversionRate * representativeAverageJobValue);
  const website = await inspectWebsite(input.websiteUrl);
  const missedCalls = missedCallSection(input, estimatedMonthlyMissedCalls, representativeMonthlyCalls);
  const googleProfile: AuditSection = {
    id: "google-business-profile",
    title: "Google Business Profile audit",
    status: "Unable to verify",
    summary: input.googleBusinessProfileUrl
      ? "The supplied public profile link was format-checked only. This app has no Google Business Profile API connection, so profile data was not read."
      : "No profile link was provided, and no Google Business Profile API is configured.",
    findings: [
      finding("Profile access", "Unable to verify", "Profile ownership, visibility, and listing details were not retrieved."),
      finding("Hours, categories, and service areas", "Unable to verify", "These profile details require manual verification or an authorized Google integration."),
      finding("Ratings, reviews, and responses", "Unable to verify", "No review counts, ratings, or response data are available to this audit."),
    ],
  };
  const leadRecovery: AuditSection = {
    id: "lead-recovery",
    title: "Lead recovery opportunities",
    status: "Needs improvement",
    summary: "The current app supports device call capture, editable reply templates, and manually opened SMS/WhatsApp follow-up links. It does not send automated messages or book appointments.",
    findings: [
      finding("Call capture and lead tracking", "Good", "The app includes paired Android-device call capture and a dashboard call log."),
      finding("Reply templates and manual follow-up", "Good", "The dashboard includes editable reply templates and links that open SMS or WhatsApp for manual follow-up."),
      finding("Automatic text-back and appointment booking", "Needs improvement", "Automated messaging and booking are not connected in the current app."),
      finding("Review requests and past-customer reactivation", "Unable to verify", "No connected review-request or customer-reactivation integration was found in the current app."),
    ],
  };

  return {
    businessName: input.businessName,
    auditDate: auditDate.toISOString(),
    overallScore: null,
    scoreExplanation: "A score is not shown because the available website checks are limited to a homepage snapshot and Google Business Profile data is not connected. Scoring without enough comparable, verified signals would be misleading.",
    revenue: {
      representativeMonthlyCalls,
      representativeMissRate: representativeMissRateValue,
      estimatedMonthlyMissedCalls,
      representativeJobValue: representativeAverageJobValue,
      assumedConversionRate,
      estimatedMonthlyOpportunity,
      assumptions: [
        "Each selected call and job-value range is represented by its midpoint; open-ended ranges use a conservative floor proxy.",
        "When a missed-call percentage is known, its range is represented by its midpoint; the open-ended ranges use conservative proxies.",
        "The potential opportunity assumes 10% of estimated missed calls would convert into a job. This is an illustrative planning assumption, not measured Yello performance.",
        "When you select “I don't know” for missed calls, missed-call and revenue estimates are omitted.",
      ],
    },
    sections: [googleProfile, website.section, missedCalls, leadRecovery],
    recommendations: buildRecommendations(website.recommendations, input),
    disclaimer: "Revenue figures are estimates based on your selections and the assumptions shown above. They are not verified financial losses, guaranteed savings, or a forecast of results.",
  };
}
