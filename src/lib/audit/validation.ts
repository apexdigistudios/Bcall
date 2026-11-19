import {
  auditBusinessTypes,
  jobValueRanges,
  missedCallRanges,
  monthlyCallRanges,
  type AuditField,
  type AuditFormData,
} from "./types";

export type AuditValidationResult =
  | { valid: true; data: AuditFormData }
  | { valid: false; fieldErrors: Partial<Record<AuditField, string>> };

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength)
    : "";
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  return (
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

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid")
  ) return true;
  if (host.includes(":")) {
    const firstHextet = Number.parseInt(host.split(":")[0] || "0", 16);
    return !Number.isInteger(firstHextet) || firstHextet < 0x2000 || firstHextet > 0x3fff;
  }
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) && isPrivateIpv4(host);
}

export function normalizeAuditUrl(value: string, requireGoogleProfile = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 2048 || /[\u0000-\u0020\u007f]/.test(trimmed)) return null;

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) ||
    isBlockedHostname(url.hostname)
  ) return null;

  if (requireGoogleProfile) {
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    const isGoogleHost =
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "g.page" ||
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "share.google";
    const isGoogleMapsHost = host.startsWith("maps.") || url.pathname.toLowerCase().includes("maps");
    if (!isGoogleHost || ((host === "google.com" || host.endsWith(".google.com")) && !isGoogleMapsHost)) return null;
  }

  url.hash = "";
  return url.toString();
}

export function validateAuditSubmission(input: unknown): AuditValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, fieldErrors: { businessName: "Please complete the audit form." } };
  }

  const raw = input as Record<string, unknown>;
  const businessName = cleanText(raw.businessName, 160);
  const websiteInput = cleanText(raw.websiteUrl, 2048);
  const googleProfileInput = cleanText(raw.googleBusinessProfileUrl, 2048);
  const businessType = cleanText(raw.businessType, 80);
  const monthlyCallsRange = cleanText(raw.monthlyCallsRange, 30);
  const missedCallsRange = cleanText(raw.missedCallsRange, 30);
  const averageJobValueRange = cleanText(raw.averageJobValueRange, 40);
  const businessEmail = cleanText(raw.businessEmail, 254).toLowerCase();
  const fieldErrors: Partial<Record<AuditField, string>> = {};

  if (businessName.length < 2) fieldErrors.businessName = "Enter a business name with at least 2 characters.";

  const websiteUrl = normalizeAuditUrl(websiteInput);
  if (websiteInput && !websiteUrl) fieldErrors.websiteUrl = "Enter a valid public website URL.";

  const googleBusinessProfileUrl = normalizeAuditUrl(googleProfileInput, true);
  if (googleProfileInput && !googleBusinessProfileUrl) {
    fieldErrors.googleBusinessProfileUrl = "Enter a Google Maps or Business Profile URL.";
  }

  if (!auditBusinessTypes.includes(businessType as (typeof auditBusinessTypes)[number])) {
    fieldErrors.businessType = "Choose your business type.";
  }
  if (!monthlyCallRanges.includes(monthlyCallsRange as (typeof monthlyCallRanges)[number])) {
    fieldErrors.monthlyCallsRange = "Choose an average monthly call range.";
  }
  if (!missedCallRanges.includes(missedCallsRange as (typeof missedCallRanges)[number])) {
    fieldErrors.missedCallsRange = "Choose an estimated missed-call range.";
  }
  if (!jobValueRanges.includes(averageJobValueRange as (typeof jobValueRanges)[number])) {
    fieldErrors.averageJobValueRange = "Choose an average job value range.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(businessEmail)) {
    fieldErrors.businessEmail = "Enter a valid business email address.";
  }

  if (Object.keys(fieldErrors).length > 0) return { valid: false, fieldErrors };

  return {
    valid: true,
    data: {
      businessName,
      websiteUrl: websiteUrl ?? "",
      googleBusinessProfileUrl: googleBusinessProfileUrl ?? "",
      businessType: businessType as AuditFormData["businessType"],
      monthlyCallsRange: monthlyCallsRange as AuditFormData["monthlyCallsRange"],
      missedCallsRange: missedCallsRange as AuditFormData["missedCallsRange"],
      averageJobValueRange: averageJobValueRange as AuditFormData["averageJobValueRange"],
      businessEmail,
    },
  };
}
