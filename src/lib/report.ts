import type { AuditInput } from "./schema";
import type { WebsiteAudit } from "./website";
import type { OsmAudit } from "./osm";
import { calculateLeak } from "./leak";

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
  executiveSummary: string;
  websiteFindings: string[];
  listingFindings: string[];
  leadRecoverySummary: string;
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
  const averageCustomerValue = input.averageCustomerValue ?? input.monthlyRevenue / 40;
  const callToBookingRate = input.callToBookingRate ?? 30;
  const websiteFindings = website.status === "unavailable"
    ? [website.message ?? "The public website check was unavailable; no website leak was assigned."]
    : website.checks.filter(({ pass }) => !pass).map(({ label, evidence }) => `${label}: ${evidence}`);
  const listingFindings = [
    "No direct Google Business Profile lookup is configured; listing data below comes from OpenStreetMap only.",
    openStreetMap.status === "found"
      ? `OpenStreetMap listing found${openStreetMap.displayName ? `: ${openStreetMap.displayName}` : ""}. ${openStreetMap.message}`
      : openStreetMap.message,
    ...(openStreetMap.status === "found" && openStreetMap.phoneMatchesWebsite === false
      ? ["The OpenStreetMap phone number differs from the audited website."]
      : []),
    ...(openStreetMap.status === "found" && openStreetMap.websiteMatchesInput === false
      ? ["The OpenStreetMap website differs from the audited URL."]
      : []),
    input.googleRating === undefined && input.googleReviewCount === undefined
      ? "Rating and review count were not provided; no reputation leak was estimated."
      : `Rating and review count are self-reported and were not independently verified. ${reputationIsLeaking ? "The provided values meet the estimate's reputation-attention threshold." : "The provided values do not meet the estimate's reputation-attention threshold."}`,
  ];
  const executiveSummary =
    `${input.businessName} in ${input.city} has an estimated monthly revenue opportunity of ${money.format(calculation.breakdown.total.expected)} ` +
    `(range: ${money.format(calculation.breakdown.total.low)}–${money.format(calculation.breakdown.total.high)}). ` +
    `The missed-call component is ${money.format(calculation.breakdown.calls.expected)} expected per month. ` +
    `This estimate uses the submitted figures, disclosed defaults, and limited public checks; it is not a guarantee.`;
  const leadRecoverySummary =
    `Based on ${input.missedCallsPerMonth} reported missed calls per month, a ${callToBookingRate}% call-to-customer rate, ` +
    `an average customer/job value of ${money.format(averageCustomerValue)}, and the 15% callback/recovery assumption, ` +
    `the estimated missed-call opportunity is ${money.format(calculation.breakdown.calls.expected)} per month ` +
    `(range: ${money.format(calculation.breakdown.calls.low)}–${money.format(calculation.breakdown.calls.high)}).`;

  return {
    ...calculation,
    businessName: input.businessName,
    city: input.city,
    generatedAt: generatedAt.toISOString(),
    headline: `Estimated revenue opportunity: ${money.format(calculation.breakdown.total.low)} to ${money.format(calculation.breakdown.total.high)} per month (${money.format(calculation.breakdown.total.annualized)} expected per year).`,
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
    disclaimer: "Estimates are based on self-reported numbers, disclosed assumptions, a limited scan of your public website, and OpenStreetMap data where available. Scores and financial figures are calculated deterministically by the server. This is not a guarantee of results.",
    executiveSummary,
    websiteFindings: websiteFindings.length > 0
      ? websiteFindings
      : ["No failed checks were identified in the limited public homepage scan."],
    listingFindings,
    leadRecoverySummary,
  };
}
