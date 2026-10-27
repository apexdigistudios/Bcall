import "dotenv/config";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { demoRequests } from "@/db/schema";

 test.afterAll(async () => { await pool.end(); });

test("renders the landing page and replays the recovery flow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/CallBackly/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Turn missed calls");
  await expect(page.getByText("Booked. Just like that.")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/callbackly-desktop.png" });
  await page.getByRole("button", { name: "Replay missed-call recovery flow" }).click();
  await expect(page.getByText("A missed call. We’ve got it.")).toBeVisible();
  await expect(page.getByText("Booked. Just like that.")).toBeVisible();
  await page.getByRole("button", { name: "Show missed call stage" }).click();
  await expect(page.getByText("A missed call. We’ve got it.")).toBeVisible();
  await page.getByRole("button", { name: "Show booked stage" }).click();
  await expect(page.getByText("Booked. Just like that.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("updates revenue from numeric inputs and the sliders", async ({ page }) => {
  await page.goto("/#roi-calculator");
  const output = page.locator("#revenue-estimate");
  await expect(output).toHaveText("$10,800");
  await page.getByLabel("Missed calls per day", { exact: true }).fill("5");
  await page.getByLabel("Average customer value", { exact: true }).fill("1000");
  await page.getByLabel("Estimated recovery rate", { exact: true }).fill("10");
  await expect(output).toHaveText("$15,000");
  await page.getByRole("slider", { name: "Missed calls per day slider" }).press("End");
  await expect(output).toHaveText("$150,000");
  await page.getByLabel("Average customer value", { exact: true }).fill("0");
  await expect(output).toHaveText("$0");
  await page.getByLabel("Average customer value", { exact: true }).fill("150");
  await page.getByLabel("Estimated recovery rate", { exact: true }).fill("0");
  await expect(output).toHaveText("$0");
});

test("personalizes industry inquiries and supports keyboard dismissal", async ({ page }) => {
  await page.goto("/#industries");
  await page.getByRole("button", { name: "Home services", exact: true }).click();
  await expect(page.getByRole("button", { name: "Home services", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/From the job site to the next job/)).toBeVisible();
  await page.getByRole("button", { name: "Sounds like us" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Business type", { exact: false })).toHaveValue("Home services");
  await expect(dialog.getByLabel("Your name", { exact: false })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Sounds like us" })).toBeFocused();
});

test("opens one FAQ at a time", async ({ page }) => {
  await page.goto("/#faq");
  const first = page.getByRole("button", { name: "What exactly does CallBackly do?" });
  const second = page.getByRole("button", { name: "Do I need to change my business phone number?" });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("region", { name: "Do I need to change my business phone number?" })).toBeVisible();
  await second.press("Enter");
  await expect(second).toHaveAttribute("aria-expanded", "false");
});

test("saves a real trial inquiry and returns a confirmation", async ({ page, request }) => {
  const invalid = await request.post("/api/demo", { data: { name: "A", email: "invalid" } });
  expect(invalid.status()).toBe(400);
  const email = `callbackly-browser-test-${Date.now()}@example.com`;
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Start my 14-day free trial", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Your name", { exact: false }).fill("Alex Browser Test");
    await dialog.getByLabel("Work email", { exact: false }).fill(email);
    await dialog.getByLabel("Business name", { exact: false }).fill("CallBackly Browser Test Business");
    await dialog.getByLabel("Business type", { exact: false }).selectOption("Salon or barbershop");
    await dialog.getByLabel("Phone number", { exact: false }).fill("+1 (555) 123-4567");
    await dialog.getByRole("checkbox").check();
    const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/demo") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Start my 14-day free trial", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    expect((await response.json()).reference).toMatch(/^[A-F0-9]{8}$/);
    await expect(dialog.getByRole("heading", { name: /You’re on the list/ })).toBeVisible();
    const [saved] = await db.select().from(demoRequests).where(eq(demoRequests.email, email));
    expect(saved.kind).toBe("trial");
    expect(saved.consent).toBe(true);
    expect(saved.businessName).toBe("CallBackly Browser Test Business");
    await dialog.getByRole("button", { name: "Back to CallBackly" }).click();
    await expect(dialog).not.toBeVisible();
  } finally {
    await db.delete(demoRequests).where(eq(demoRequests.email, email));
  }
});

test("keeps the mobile navigation and narrow layouts usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "ROI calculator" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).not.toBeVisible();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/callbackly-mobile.png" });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `No horizontal page overflow at ${width}px`).toBe(false);
  }
});

test("serves legal pages and the database healthcheck", async ({ page, request }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your privacy matters.");
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A few ground rules.");
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ ok: true });
});
