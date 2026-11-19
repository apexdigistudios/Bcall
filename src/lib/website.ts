import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

export type WebsiteCheck = {
  id: string;
  label: string;
  pass: boolean;
  impact: "high" | "medium" | "low";
  evidence: string;
};

export type WebsiteAudit = {
  status: "checked" | "unavailable";
  url: string;
  phone: string | null;
  checks: WebsiteCheck[];
  message?: string;
};

const timeoutMs = 10_000;
const maxPageBytes = 2 * 1024 * 1024;
const userAgent = "YelloRevenueLeakAudit/1.0";

function safeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code) ? error.code : undefined;
}

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    if (isIP(mapped) === 4) return isPublicIpv4(mapped);
  }
  const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return isIP(normalized) === 6 && firstGroup >= 0x2000 && firstGroup <= 0x3fff &&
    !normalized.startsWith("2001:db8:") && !normalized.startsWith("2002:");
}

async function assertPublicHost(hostname: string): Promise<void> {
  const bareHostname = hostname.replace(/^\[|\]$/g, "");
  const family = isIP(bareHostname);
  if (family) {
    const publicAddress = family === 4 ? isPublicIpv4(bareHostname) : isPublicIpv6(bareHostname);
    if (!publicAddress) throw new Error("The website host is not public.");
    return;
  }

  let lookupTimer: NodeJS.Timeout | undefined;
  const addresses = await Promise.race([
    lookup(bareHostname, { all: true, verbatim: true }),
    new Promise<never>((_resolve, reject) => {
      lookupTimer = setTimeout(() => reject(new Error("Website DNS lookup timed out.")), timeoutMs);
    }),
  ]).finally(() => {
    if (lookupTimer) clearTimeout(lookupTimer);
  });
  if (!addresses.length || addresses.some(({ address, family: addressFamily }) =>
    addressFamily === 4 ? !isPublicIpv4(address) : !isPublicIpv6(address))) {
    throw new Error("The website host does not resolve exclusively to public addresses.");
  }
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxPageBytes) {
      await reader.cancel();
      throw new Error("The website response exceeded the size limit.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function fetchHomepage(startUrl: string): Promise<{ url: URL; html: string }> {
  let url = new URL(startUrl);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS websites can be checked.");
    if (url.username || url.password) throw new Error("Website URLs with embedded credentials cannot be checked.");
    if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) {
      throw new Error("Non-standard website ports cannot be checked.");
    }
    await assertPublicHost(url.hostname);
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirectCount === 3) throw new Error("The website redirected too many times.");
      const location = response.headers.get("location");
      if (!location) throw new Error("The website returned an invalid redirect.");
      await response.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) throw new Error(`The website returned HTTP ${response.status}.`);
    if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("html")) {
      throw new Error("The website did not return an HTML page.");
    }
    return { url, html: await readLimitedBody(response) };
  }
  throw new Error("The website could not be reached.");
}

function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export async function auditWebsite(inputUrl: string): Promise<WebsiteAudit> {
  try {
    const { url, html } = await fetchHomepage(inputUrl);
    const $ = cheerio.load(html);
    const visibleText = $("body").text().replace(/\s+/g, " ").trim();
    const telPhone = $('a[href^="tel:"]').first().attr("href")?.slice(4);
    const visiblePhone = visibleText.match(/(?:\+?\d[\d\s().-]{5,}\d)/)?.[0];
    const phone = normalizePhone(telPhone) ?? normalizePhone(visiblePhone ?? undefined);
    const title = $("title").first().text().trim();
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
    const viewport = $('meta[name="viewport"]').length > 0;
    const hasTopCta = $("a, button").slice(0, 20).toArray().some((element) => {
      const text = $(element).text().trim().toLowerCase();
      return /call|contact|book|schedule|get (a )?quote|appointment/.test(text);
    });
    const bookingLink = $("a[href], iframe[src]").toArray().some((element) => {
      const href = ($(element).attr("href") ?? $(element).attr("src") ?? "").toLowerCase();
      const text = $(element).text().toLowerCase();
      return /book|schedule|appointment|calendly|acuity|squareup/.test(`${href} ${text}`);
    });
    const chatWidget = $("script[src]").toArray().some((element) =>
      /intercom|drift|crisp|tawk|livechat|zendesk|hubspot/i.test($(element).attr("src") ?? ""));
    const reviews = /review|testimonial|customer stories|what our customers say/i.test(visibleText);
    const checks: WebsiteCheck[] = [
      { id: "phone", label: "Phone number visible", pass: Boolean(phone), impact: "high", evidence: phone ? "A phone number was found in the homepage text or a telephone link." : "No phone number was found in the homepage snapshot." },
      { id: "click-to-call", label: "Click-to-call link", pass: $('a[href^="tel:"]').length > 0, impact: "high", evidence: $('a[href^="tel:"]').length > 0 ? "A telephone link is present." : "No click-to-call link was found." },
      { id: "contact-form", label: "Contact form", pass: $("form").length > 0, impact: "medium", evidence: $("form").length > 0 ? "A form is present on the homepage." : "No contact form was found on the homepage." },
      { id: "booking", label: "Booking or scheduling path", pass: bookingLink, impact: "medium", evidence: bookingLink ? "A booking or scheduling cue was found." : "No booking or scheduling link was found." },
      { id: "live-chat", label: "Live chat", pass: chatWidget, impact: "low", evidence: chatWidget ? "A common live-chat widget script was found." : "No common live-chat widget script was found." },
      { id: "top-cta", label: "Clear contact action near the top", pass: hasTopCta, impact: "high", evidence: hasTopCta ? "A contact-oriented action appears in the homepage's opening content." : "No clear contact action was found near the top of the homepage." },
      { id: "https", label: "HTTPS", pass: url.protocol === "https:", impact: "medium", evidence: url.protocol === "https:" ? "The final page uses HTTPS." : "The final page uses HTTP." },
      { id: "title", label: "Page title", pass: Boolean(title), impact: "low", evidence: title ? `Title found: ${title.slice(0, 120)}` : "No page title was found." },
      { id: "description", label: "Meta description", pass: Boolean(metaDescription), impact: "low", evidence: metaDescription ? "A meta description is present." : "No meta description was found." },
      { id: "viewport", label: "Mobile viewport", pass: viewport, impact: "medium", evidence: viewport ? "A mobile viewport meta tag is present." : "No mobile viewport meta tag was found." },
      { id: "reviews", label: "Reviews or testimonials", pass: reviews, impact: "low", evidence: reviews ? "Review or testimonial language was found." : "No review or testimonial language was found." },
    ];
    return { status: "checked", url: url.toString(), phone, checks };
  } catch (error) {
    console.warn(JSON.stringify({
      event: "audit.website_unavailable",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: safeErrorCode(error),
    }));
    return {
      status: "unavailable",
      url: inputUrl,
      phone: null,
      checks: [],
      message: "The homepage could not be safely checked or did not return a readable public HTML page.",
    };
  }
}

export function normalizeWebsiteForComparison(value: string): string {
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value.toLowerCase().replace(/^www\./, "").replace(/\/+$/, "");
  }
}
