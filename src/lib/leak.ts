import type { AuditInput } from "./schema";
import type { WebsiteAudit } from "./website";
import type { OsmAudit } from "./osm";

export type LeakRange = {
  low: number;
  expected: number;
  high: number;
  annualized: number;
};

export type LeakBreakdown = {
  calls: LeakRange;
  website: LeakRange;
  reputation: LeakRange;
  total: LeakRange;
  capped: boolean;
  assumptions: string[];
};

const impactRate = { high: 0.02, medium: 0.01, low: 0.005 } as const;
const failedCheckPenalty = { high: 8, medium: 4, low: 2 } as const;

function range(expected: number): LeakRange {
  return {
    low: expected * 0.7,
    expected,
    high: expected * 1.3,
    annualized: expected * 12,
  };
}

export function calculateLeak(
  input: AuditInput,
  website: WebsiteAudit,
  osm: OsmAudit,
): { breakdown: LeakBreakdown; score: number; fixes: Array<{ title: string; how: string; expectedRecovery: number; source: string }> } {
  const averageCustomerValue = input.averageCustomerValue ?? input.monthlyRevenue / 40;
  const callToBookingRate = (input.callToBookingRate ?? 30) / 100;
  const callbackShare = 0.15;
  const callLeakRaw = input.missedCallsPerMonth * callToBookingRate * averageCustomerValue * (1 - callbackShare);
  const websiteLeakRaw = website.status === "checked"
    ? website.checks.filter((check) => !check.pass).reduce((sum, check) => sum + input.monthlyRevenue * impactRate[check.impact], 0)
    : 0;
  const reputationIsVerifiable = input.googleRating !== undefined || input.googleReviewCount !== undefined;
  const reputationIsLeaking = reputationIsVerifiable &&
    ((input.googleRating !== undefined && input.googleRating < 4.2) ||
      (input.googleReviewCount !== undefined && input.googleReviewCount < 25));
  const reputationLeakRaw = reputationIsLeaking ? input.monthlyRevenue * 0.02 : 0;
  const uncappedTotal = callLeakRaw + websiteLeakRaw + reputationLeakRaw;
  const cap = input.monthlyRevenue * 0.5;
  const capped = uncappedTotal > cap;
  const scale = capped ? cap / uncappedTotal : 1;
  const calls = callLeakRaw * scale;
  const websiteAmount = websiteLeakRaw * scale;
  const reputationAmount = reputationLeakRaw * scale;
  const total = calls + websiteAmount + reputationAmount;

  const assumptions = [
    input.averageCustomerValue === undefined
      ? `Average customer/job value defaults to monthly revenue divided by 40 customers (${input.monthlyRevenue}/40).`
      : `Average customer/job value of ${input.averageCustomerValue} was provided.`,
    input.callToBookingRate === undefined
      ? "Call-to-customer rate defaults to 30%."
      : `Call-to-customer rate of ${input.callToBookingRate}% was provided.`,
    "15% of missed callers are assumed to call back or otherwise recover; other missed callers are treated as lost for this estimate.",
    "Failed website checks use high = 2%, medium = 1%, and low = 0.5% of monthly revenue as conservative impact proxies.",
    reputationIsVerifiable
      ? "A 2% monthly-revenue reputation proxy is applied only when a provided rating is below 4.2 or review count is below 25."
      : "No reputation leak is included because rating and review count were not provided.",
    `Total expected leak is capped at 50% of stated monthly revenue${capped ? "; the cap was applied to this estimate." : "; the cap was not reached."}`,
    "Displayed low/high ranges are 70%/130% of the expected estimate; annualized values are expected monthly values multiplied by 12.",
    "The score starts at 100; failed website checks subtract 8/4/2 points by high/medium/low impact, local listing and reputation gaps subtract documented small penalties, and the estimated leak ratio subtracts up to 40 points. An unavailable website check subtracts 5 points; unavailable OpenStreetMap data is not treated as a failure.",
  ];

  const fixes: Array<{ title: string; how: string; expectedRecovery: number; source: string }> = [{
    title: "Recover missed callers",
    how: "Set up a reliable callback process, answering coverage, or missed-call text-back.",
    expectedRecovery: calls,
    source: "calls",
  }];
  if (website.status === "checked") {
    for (const check of website.checks.filter((item) => !item.pass)) {
      fixes.push({
        title: check.label,
        how: ({
          phone: "Show a current phone number in the page header and contact section.",
          "click-to-call": "Make the phone number a tap-to-call link using a tel: URL.",
          "contact-form": "Add a short, working contact form for visitors who cannot call.",
          booking: "Add a clear booking or appointment-scheduling link.",
          "live-chat": "Consider adding a monitored live-chat option for visitors who need help.",
          "top-cta": "Place a clear call, contact, or quote action near the top of the homepage.",
          https: "Configure HTTPS and redirect the HTTP version to the secure site.",
          title: "Add a concise page title that identifies the business and service area.",
          description: "Add a short, accurate search-result description for the homepage.",
          viewport: "Add a responsive viewport meta tag and test the site on a phone.",
          reviews: "Show authentic customer reviews or testimonials with permission.",
        } as Record<string, string>)[check.id] ?? "Review this website item and make the next step clear.",
        expectedRecovery: input.monthlyRevenue * impactRate[check.impact] * scale,
        source: "website",
      });
    }
  }
  if (reputationIsLeaking) {
    fixes.push({
      title: "Strengthen public reputation signals",
      how: "Ask recent customers for honest reviews and respond professionally to feedback.",
      expectedRecovery: reputationAmount,
      source: "reputation",
    });
  }
  if (osm.status === "not-found") {
    fixes.push({
      title: "Check local directory coverage",
      how: "Verify your business details on relevant local directories; OpenStreetMap is optional and may not list every business.",
      expectedRecovery: 0,
      source: "local listing",
    });
  }

  let score = 100;
  if (website.status === "checked") {
    score -= website.checks.filter((check) => !check.pass)
      .reduce((sum, check) => sum + failedCheckPenalty[check.impact], 0);
  } else {
    score -= 5;
  }
  if (osm.status === "found") {
    if (!osm.phone) score -= 4;
    if (!osm.website) score -= 2;
    if (!osm.openingHours) score -= 2;
    if (osm.phoneMatchesWebsite === false || osm.websiteMatchesInput === false) score -= 6;
  } else if (osm.status === "not-found") {
    score -= 2;
  }
  if (reputationIsLeaking) score -= 8;
  score -= Math.min(40, (total / input.monthlyRevenue) * 80);

  return {
    breakdown: {
      calls: range(calls),
      website: range(websiteAmount),
      reputation: range(reputationAmount),
      total: range(total),
      capped,
      assumptions,
    },
    score: Math.max(0, Math.min(100, Math.round(score))),
    fixes: fixes.sort((a, b) => b.expectedRecovery - a.expectedRecovery).slice(0, 5),
  };
}
