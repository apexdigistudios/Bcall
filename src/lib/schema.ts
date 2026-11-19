import { z } from "zod";

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString();
  } catch {
    return candidate;
  }
}

function isPublicWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".test") ||
      hostname.endsWith(".invalid")
    ) return false;
    if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) return false;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
      const octets = hostname.split(".").map(Number);
      const [a, b] = octets;
      if (
        octets.some((part) => part > 255) ||
        a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && (b === 0 || b === 168)) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 203 && b === 0)
      ) return false;
    }
    if (hostname.includes(":")) {
      const firstGroup = Number.parseInt(hostname.split(":")[0] || "0", 16);
      if (firstGroup < 0x2000 || firstGroup > 0x3fff) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const optionalPositiveNumber = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().finite().positive().max(1_000_000_000).optional(),
);

const optionalPercentage = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().finite().min(0).max(100).optional(),
);

const optionalReviewCount = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().finite().int().min(0).optional(),
);

export const auditInputSchema = z.object({
  businessName: z.string().trim().min(2, "Enter a business name with at least 2 characters.").max(160),
  city: z.string().trim().min(2, "Enter your business city.").max(100),
  websiteUrl: z.string()
    .trim()
    .min(1, "Enter your website URL.")
    .max(2048)
    .transform(normalizeWebsiteUrl)
    .pipe(z.string().url("Enter a valid website URL.").refine(isPublicWebsite, "Use a public HTTP or HTTPS website.")),
  missedCallsPerMonth: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" || value === null || value === undefined ? Number.NaN : value,
    z.coerce.number().finite().int().min(0, "Enter zero or more missed calls.").max(100_000),
  ),
  monthlyRevenue: z.coerce.number().finite().positive("Enter monthly revenue greater than zero.").max(1_000_000_000),
  averageCustomerValue: optionalPositiveNumber,
  callToBookingRate: optionalPercentage,
  googleRating: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().finite().min(0).max(5).optional(),
  ),
  googleReviewCount: optionalReviewCount,
});

export type AuditFormInput = z.input<typeof auditInputSchema>;
export type AuditInput = z.output<typeof auditInputSchema>;
