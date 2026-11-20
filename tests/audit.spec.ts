import { expect, test } from "@playwright/test";
import { auditInputSchema } from "../src/lib/schema";
import { auditWebsite, type WebsiteAudit } from "../src/lib/website";
import { calculateLeak } from "../src/lib/leak";
import { buildAuditReport } from "../src/lib/report";
import type { AuditInput } from "../src/lib/schema";
import type { OsmAudit } from "../src/lib/osm";

const validInput = auditInputSchema.parse({
  businessName: "Example Plumbing",
  city: "Austin",
  websiteUrl: "example.com/?utm_source=campaign&keep=yes",
  missedCallsPerMonth: "10",
  monthlyRevenue: "100000",
});

const checkedWebsite: WebsiteAudit = {
  status: "checked",
  url: "https://example.com/",
  phone: "5125550100",
  checks: [
    { id: "phone", label: "Phone number visible", pass: false, impact: "high", evidence: "None found." },
    { id: "title", label: "Page title", pass: true, impact: "low", evidence: "Title present." },
  ],
};

const foundOsm: OsmAudit = {
  status: "found",
  displayName: "Example Plumbing, Austin",
  phone: "512-555-0100",
  website: "https://www.example.com",
  openingHours: "Mo-Fr 09:00-17:00",
  phoneMatchesWebsite: true,
  websiteMatchesInput: true,
  message: "OpenStreetMap is community maintained.",
};

test("validates fields, normalizes website URL, and strips tracking parameters", () => {
  expect(validInput.websiteUrl).toBe("https://example.com/?keep=yes");
  expect(auditInputSchema.safeParse({
    ...validInput,
    websiteUrl: "http://127.0.0.1",
  }).success).toBe(false);
  expect(auditInputSchema.safeParse({
    ...validInput,
    websiteUrl: "javascript:alert(1)",
  }).success).toBe(false);
  expect(auditInputSchema.safeParse({
    ...validInput,
    missedCallsPerMonth: -1,
  }).success).toBe(false);
  expect(auditInputSchema.safeParse({
    ...validInput,
    monthlyRevenue: 0,
  }).success).toBe(false);
  expect(auditInputSchema.safeParse({
    ...validInput,
    missedCallsPerMonth: "",
  }).success).toBe(false);
});

test("uses stated defaults and calculates deterministic missed-call, website, and reputation leaks", () => {
  const withReputation: AuditInput = {
    ...validInput,
    googleRating: 4.0,
    googleReviewCount: 18,
  };
  const result = calculateLeak(withReputation, checkedWebsite, foundOsm);
  expect(result.breakdown.calls.expected).toBe(6_375);
  expect(result.breakdown.website.expected).toBe(2_000);
  expect(result.breakdown.reputation.expected).toBe(2_000);
  expect(result.breakdown.total.expected).toBe(10_375);
  expect(result.breakdown.total.low).toBeCloseTo(7_262.5);
  expect(result.breakdown.total.high).toBeCloseTo(13_487.5);
  expect(result.breakdown.total.annualized).toBe(124_500);
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
});

test("caps the expected total leak at half of stated monthly revenue", () => {
  const highVolume = auditInputSchema.parse({
    ...validInput,
    missedCallsPerMonth: 10_000,
    monthlyRevenue: 1_000,
    averageCustomerValue: 1_000,
    callToBookingRate: 100,
  });
  const result = calculateLeak(highVolume, { ...checkedWebsite, checks: [] }, { status: "unavailable", message: "Unavailable." });
  expect(result.breakdown.total.expected).toBe(500);
  expect(result.breakdown.capped).toBe(true);
});

test("website SSRF guard refuses a loopback URL without making a request", async () => {
  const result = await auditWebsite("http://127.0.0.1");
  expect(result.status).toBe("unavailable");
  expect(result.checks).toHaveLength(0);
});

test("report identifies data sources, assumptions, and ranked fixes", () => {
  const report = buildAuditReport(validInput, checkedWebsite, foundOsm, new Date("2026-11-19T00:00:00.000Z"));
  expect(report.headline).toContain("per month");
  expect(report.score).toBeGreaterThanOrEqual(0);
  expect(report.fixes[0].title).toBe("Recover missed callers");
  expect(report.breakdown.assumptions.some((item) => item.includes("30%"))).toBe(true);
  expect(report.disclaimer).toContain("not a guarantee");
  expect(report.dataSources).toContain("A limited scan of the public website homepage.");
  expect(report.executiveSummary).toContain("$8,375 (range:");
  expect(report.leadRecoverySummary).toContain("10 reported missed calls per month");
  expect(report.websiteFindings).toContain("Phone number visible: None found.");
  expect(report.listingFindings[0]).toContain("No direct Google Business Profile lookup");
  expect(report.fixes[0].title).toBe("Recover missed callers");
});

test("builds grounded findings when website and listing checks are unavailable", () => {
  const report = buildAuditReport(
    validInput,
    { status: "unavailable", url: validInput.websiteUrl, phone: null, checks: [], message: "Website scan unavailable." },
    { status: "unavailable", message: "OpenStreetMap lookup unavailable." },
  );
  expect(report.websiteFindings).toEqual(["Website scan unavailable."]);
  expect(report.listingFindings).toContain("OpenStreetMap lookup unavailable.");
  expect(report.listingFindings).toContain("Rating and review count were not provided; no reputation leak was estimated.");
});
