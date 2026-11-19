import { expect, test } from "@playwright/test";
import { generateAuditReport } from "../src/lib/audit/engine";
import { normalizeAuditUrl, validateAuditSubmission } from "../src/lib/audit/validation";
import type { AuditFormData } from "../src/lib/audit/types";

const validSubmission: AuditFormData = {
  businessName: "Example Plumbing",
  websiteUrl: "",
  googleBusinessProfileUrl: "",
  businessType: "Plumbing",
  monthlyCallsRange: "100–250",
  missedCallsRange: "10–25%",
  averageJobValueRange: "$500–$1,500",
  businessEmail: "owner@example.com",
};

test("validates audit selections and safely normalizes URLs", () => {
  const validation = validateAuditSubmission(validSubmission);
  expect(validation.valid).toBe(true);
  expect(normalizeAuditUrl("example.com")).toBe("https://example.com/");
  expect(normalizeAuditUrl("maps.google.com/?cid=123", true)).toBe("https://maps.google.com/?cid=123");
  expect(normalizeAuditUrl("http://127.0.0.1")).toBeNull();
  expect(normalizeAuditUrl("http://[::1]")).toBeNull();
  expect(normalizeAuditUrl("javascript:alert(1)")).toBeNull();
  expect(normalizeAuditUrl("https://user:pass@example.com")).toBeNull();
  expect(normalizeAuditUrl("https://example.com", true)).toBeNull();
});

test("calculates only disclosed revenue opportunity and omits it for unknown missed calls", async () => {
  const report = await generateAuditReport(validSubmission, new Date("2026-11-19T00:00:00.000Z"));
  expect(report.overallScore).toBeNull();
  expect(report.revenue.representativeMonthlyCalls).toBe(175);
  expect(report.revenue.representativeMissRate).toBe(0.175);
  expect(report.revenue.estimatedMonthlyMissedCalls).toBe(30.6);
  expect(report.revenue.assumedConversionRate).toBe(0.1);
  expect(report.revenue.estimatedMonthlyOpportunity).toBe(3060);
  expect(report.sections).toHaveLength(4);
  expect(report.recommendations).toHaveLength(3);
  expect(report.disclaimer).toContain("not verified financial losses");

  const unknownReport = await generateAuditReport({
    ...validSubmission,
    missedCallsRange: "I don't know",
  }, new Date("2026-11-19T00:00:00.000Z"));
  expect(unknownReport.revenue.estimatedMonthlyMissedCalls).toBeNull();
  expect(unknownReport.revenue.estimatedMonthlyOpportunity).toBeNull();
  expect(unknownReport.sections[2].status).toBe("Unable to verify");
});

test("the public audit validates each step without showing an unsaved report", async ({ page }) => {
  await page.goto("/audit");
  await expect(page.getByRole("heading", { name: /See where missed calls/ })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").getByText("Enter a business name with at least 2 characters.")).toBeVisible();

  await page.getByLabel("Business name").fill("Example Plumbing");
  await page.getByLabel("Business type").selectOption("Plumbing");
  await page.getByLabel("Website URL (optional)").fill("localhost");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").getByText("Enter a valid public website URL.")).toBeVisible();
  await page.getByLabel("Website URL (optional)").fill("example.com");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Your call activity" })).toBeVisible();
  await page.getByLabel("Average monthly calls").selectOption("100–250");
  await page.getByLabel("Estimated missed calls").selectOption("I don't know");
  await page.getByLabel("Average job value").selectOption("$500–$1,500");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Where to send the report" })).toBeVisible();
  await page.getByLabel("Business email").fill("owner@example.com");
  await expect(page.getByRole("button", { name: "Generate My Free Audit" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Your audit findings" })).toHaveCount(0);
});
