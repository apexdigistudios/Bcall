import { expect, test } from "@playwright/test";
import { auditInputSchema } from "../src/lib/schema";
import { auditWebsite, type WebsiteAudit } from "../src/lib/website";
import { calculateLeak } from "../src/lib/leak";
import { buildAuditReport } from "../src/lib/report";
import { isTransientModelError, parseAuditDiagnosis, requestDiagnosisWithFallback } from "../src/lib/diagnosis";
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
});

test("accepts structured diagnosis text without numeric or financial figures", () => {
  const diagnosis = {
    executive_summary: "The homepage makes it difficult for callers to take the next step.",
    website_gaps: ["A direct contact action is not prominent."],
    gbp_gaps: ["Google profile details are not available for verification."],
    action_plan: [{
      priority: "high",
      title: "Make contact easier",
      action: "Place a clear call or quote action near the top of the homepage.",
    }],
  };
  expect(parseAuditDiagnosis(JSON.stringify(diagnosis))).toEqual(diagnosis);
  expect(parseAuditDiagnosis(JSON.stringify({
    ...diagnosis,
    executive_summary: "The homepage may lose $500 each month.",
  }))).toBeNull();
  expect(parseAuditDiagnosis("not JSON")).toBeNull();
});

test("retries Gemma once after a transient error, then uses the fallback model", async () => {
  const validDiagnosis = JSON.stringify({
    executive_summary: "The homepage makes it difficult for callers to take the next step.",
    website_gaps: ["A direct contact action is not prominent."],
    gbp_gaps: [],
    action_plan: [],
  });
  const calls: string[] = [];
  const delays: number[] = [];
  const result = await requestDiagnosisWithFallback(
    async (model) => {
      calls.push(model);
      if (calls.length < 3) throw { status: calls.length === 1 ? 429 : 503 };
      return validDiagnosis;
    },
    async (milliseconds) => { delays.push(milliseconds); },
  );

  expect(calls).toEqual(["gemma-4-31b-it", "gemma-4-31b-it", "gemma-4-26b-a4b-it"]);
  expect(delays).toEqual([1_200]);
  expect(result.status).toBe("generated");
  if (result.status === "generated") expect(result.model).toBe("gemma-4-26b-a4b-it");
});

test("uses deterministic fallback when the Gemma retry is not transient", async () => {
  const calls: string[] = [];
  const delays: number[] = [];
  const result = await requestDiagnosisWithFallback(
    async (model) => {
      calls.push(model);
      throw { status: calls.length === 1 ? 503 : 400 };
    },
    async (milliseconds) => { delays.push(milliseconds); },
  );

  expect(calls).toEqual(["gemma-4-31b-it", "gemma-4-31b-it"]);
  expect(delays).toEqual([1_200]);
  expect(result).toMatchObject({ status: "fallback", reason: "model_unavailable" });
});

test("recognizes Gemini transient status and code forms", () => {
  expect(isTransientModelError({ status: 503 })).toBe(true);
  expect(isTransientModelError({ status: "429" })).toBe(true);
  expect(isTransientModelError({ code: "RESOURCE_EXHAUSTED" })).toBe(true);
  expect(isTransientModelError({ code: "UNAVAILABLE" })).toBe(true);
  expect(isTransientModelError({ status: 400 })).toBe(false);
});
