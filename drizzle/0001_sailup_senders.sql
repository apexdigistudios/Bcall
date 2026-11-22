CREATE TABLE IF NOT EXISTS "sailup_senders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text,
	"name" text NOT NULL,
	"use_case" text NOT NULL,
	"sample_message" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"status_reason" text DEFAULT '' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
