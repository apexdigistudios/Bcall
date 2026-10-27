import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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

// 1. One-time pairing codes generated on the CallBackly website
export const androidPairingCodes = pgTable("android_pairing_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessName: varchar("business_name", { length: 160 }).notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. Registered/Paired Android devices
export const androidDevices = pgTable("android_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessName: varchar("business_name", { length: 160 }).notNull(),
  deviceLabel: varchar("device_label", { length: 120 }).notNull(),
  credentialHash: varchar("credential_hash", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'revoked'
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 3. Classified missed call events ingested from the Android app
export const callEvents = pgTable("call_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceId: uuid("device_id").references(() => androidDevices.id).notNull(),
  eventId: varchar("event_id", { length: 100 }).unique().notNull(), // Unique string for server-side deduplication
  callerNumber: varchar("caller_number", { length: 50 }).notNull(),
  callOutcome: varchar("call_outcome", { length: 30 }).notNull().default("missed"),
  callStartedAt: timestamp("call_started_at", { withTimezone: true }),
  callEndedAt: timestamp("call_ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").default(0),
  leadStatus: varchar("lead_status", { length: 30 }).notNull().default("new"), // 'new' | 'contacted' | 'booked' | 'lost'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});