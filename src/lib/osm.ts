import type { AuditInput } from "./schema";
import { normalizeWebsiteForComparison } from "./website";

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  extratags?: Record<string, string>;
  address?: Record<string, string>;
};

function safeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code) ? error.code : undefined;
}

export type OsmAudit = {
  status: "found" | "not-found" | "unavailable";
  displayName?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  phoneMatchesWebsite?: boolean | null;
  websiteMatchesInput?: boolean | null;
  message: string;
};

let nextRequestAt = 0;

function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export async function auditOpenStreetMap(
  input: AuditInput,
  website: { phone: string | null; url: string },
): Promise<OsmAudit> {
  const userAgent = process.env.OSM_USER_AGENT?.trim();
  if (!userAgent) {
    console.error(JSON.stringify({
      event: "audit.osm_unavailable",
      reason: "OSM_USER_AGENT is not configured",
    }));
    return { status: "unavailable", message: "OpenStreetMap lookup is not configured. Set OSM_USER_AGENT to a contactable application identifier." };
  }
  if (Date.now() < nextRequestAt) {
    return { status: "unavailable", message: "OpenStreetMap lookup was skipped to respect its one-request-per-second usage policy. No listing details were assumed." };
  }
  nextRequestAt = Date.now() + 1_000;

  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.search = new URLSearchParams({
      q: `${input.businessName} ${input.city}`,
      format: "jsonv2",
      addressdetails: "1",
      extratags: "1",
      limit: "3",
    }).toString();
    const response = await fetch(endpoint, {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`OpenStreetMap returned HTTP ${response.status}.`);
    const results = await response.json() as NominatimResult[];
    const match = results[0];
    if (!match) return { status: "not-found", message: "No matching OpenStreetMap listing was found. Many small businesses are not listed." };

    const tags = match.extratags ?? {};
    const phone = tags.phone ?? tags["contact:phone"];
    const websiteTag = tags.website ?? tags["contact:website"];
    const phoneDigits = normalizePhone(phone);
    const websitePhoneDigits = normalizePhone(website.phone ?? undefined);
    const phoneMatchesWebsite = phoneDigits && websitePhoneDigits ? phoneDigits === websitePhoneDigits : null;
    const websiteMatchesInput = websiteTag
      ? normalizeWebsiteForComparison(websiteTag) === normalizeWebsiteForComparison(input.websiteUrl)
      : null;

    return {
      status: "found",
      displayName: match.display_name,
      phone,
      website: websiteTag,
      openingHours: tags.opening_hours,
      phoneMatchesWebsite,
      websiteMatchesInput,
      message: "OpenStreetMap is a community-maintained directory. Listing completeness and accuracy are not guaranteed.",
    };
  } catch (error) {
    console.warn(JSON.stringify({
      event: "audit.osm_unavailable",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: safeErrorCode(error),
    }));
    return { status: "unavailable", message: "OpenStreetMap could not be checked right now. No listing details were assumed." };
  }
}
