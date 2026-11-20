import type { AuditInput } from "./schema";
import type { WebsiteAudit } from "./website";
import type { OsmAudit } from "./osm";
import { calculateLeak } from "./leak";
import type { AuditDiagnosisResult } from "./diagnosis";

export type AuditReport = ReturnType<typeof calculateLeak> & {
  businessName: string;
  city: string;
  generatedAt: string;
  headline: string;
  website: WebsiteAudit;
  openStreetMap: OsmAudit;
  reputation: {
    rating?: number;
    reviewCount?: number;
    status: "needs-attention" | "provided" | "not-provided";
    note: string;
  };
  dataSources: string[];
  disclaimer: string;
  diagnosis?: AuditDiagnosisResult;
};

export function buildAuditReport(
  input: AuditInput,
  website: WebsiteAudit,
  openStreetMap: OsmAudit,
  generatedAt = new Date(),
): AuditReport {
  const calculation = calculateLeak(input, website, openStreetMap);
  const reputationIsLeaking =
    (input.googleRating !== undefined && input.googleRating < 4.2) ||
    (input.googleReviewCount !== undefined && input.googleReviewCount < 25);
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return {
    ...calculation,
    businessName: input.businessName,
    city: input.city,
    generatedAt: generatedAt.toISOString(),
    headline: `You are likely losing ${money.format(calculation.breakdown.total.low)} to ${money.format(calculation.breakdown.total.high)} per month (${money.format(calculation.breakdown.total.annualized)} expected per year).`,
    website,
    openStreetMap,
    reputation: {
      ...(input.googleRating !== undefined ? { rating: input.googleRating } : {}),
      ...(input.googleReviewCount !== undefined ? { reviewCount: input.googleReviewCount } : {}),
      status: input.googleRating === undefined && input.googleReviewCount === undefined
        ? "not-provided"
        : reputationIsLeaking ? "needs-attention" : "provided",
      note: input.googleRating === undefined && input.googleReviewCount === undefined
        ? "Rating and review count were not provided, so no reputation leak was estimated."
        : "Rating and review count are self-reported and were not independently verified. OpenStreetMap does not provide review or rating data.",
    },
    dataSources: [
      "Business and financial figures supplied by the user.",
      website.status === "checked" ? "A limited scan of the public website homepage." : "Website scan unavailable; no website leak was assigned.",
      openStreetMap.status === "found" ? "A best-match OpenStreetMap Nominatim listing, when available." : "OpenStreetMap listing data unavailable or no matching business found.",
    ],
    disclaimer: "Estimates are based on self-reported numbers, a scan of your public website, and OpenStreetMap data where available. Any AI-generated narrative is explanatory only; scores and financial figures are calculated deterministically by the server. This is not a guarantee of results.",
  };
}
