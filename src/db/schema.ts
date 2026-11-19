import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { AuditReport } from "@/lib/audit/types";

export const auditReports = pgTable("audit_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  idempotencyKey: uuid("idempotency_key").notNull().unique(),
  businessName: varchar("business_name", { length: 160 }).notNull(),
  websiteUrl: text("website_url"),
  googleBusinessProfileUrl: text("google_business_profile_url"),
  businessType: varchar("business_type", { length: 80 }).notNull(),
  monthlyCallsRange: varchar("monthly_calls_range", { length: 30 }).notNull(),
  missedCallsRange: varchar("missed_calls_range", { length: 30 }).notNull(),
  averageJobValueRange: varchar("average_job_value_range", { length: 40 }).notNull(),
  businessEmail: varchar("business_email", { length: 254 }).notNull(),
  report: jsonb("report").$type<AuditReport>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const demoRequests = pgTable("demo_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  businessName: varchar("business_name", { length: 160 }).notNull(),
  businessType: varchar("business_type", { length: 60 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  message: text("message"),
  kind: varchar("kind", { length: 16 }).notNull().default("demo"),
  source: varchar("source", { length: 160 }).notNull(),
  consent: boolean("consent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One-time pairing codes generated on the y'elllo website.
export const androidPairingCodes = pgTable("android_pairing_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  codeHash: text("code_hash").notNull().unique(),
  businessName: text("business_name").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

// 2. Registered/Paired Android devices
export const androidDevices = pgTable("android_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  businessName: text("business_name").notNull(),
  deviceLabel: text("device_label").notNull(),
  status: text("status").notNull().default("active"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 3. Ingested call events from the Android app
export const callEvents = pgTable("call_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => androidDevices.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  contactName: text("contact_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});