CREATE TABLE IF NOT EXISTS "audit_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "idempotency_key" uuid NOT NULL UNIQUE,
  "business_name" varchar(160) NOT NULL,
  "website_url" text,
  "google_business_profile_url" text,
  "business_type" varchar(80) NOT NULL,
  "monthly_calls_range" varchar(30) NOT NULL,
  "missed_calls_range" varchar(30) NOT NULL,
  "average_job_value_range" varchar(40) NOT NULL,
  "business_email" varchar(254) NOT NULL,
  "report" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "audit_reports" ENABLE ROW LEVEL SECURITY;
