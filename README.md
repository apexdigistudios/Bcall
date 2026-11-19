# y'elllo

A responsive, full-stack missed-call recovery platform built with Next.js App Router, TypeScript, Tailwind CSS, Plus Jakarta Sans, Lucide icons, and PostgreSQL through Drizzle ORM.

## Run locally

1. Run `npm install`.
2. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string.
3. Apply the schema with `npx drizzle-kit push`.
4. Run `npm run dev` and open http://localhost:3000.

The supplied sandbox database is already configured. The project uses the existing `src/db/index.ts` database client.

## Features

- Responsive sticky-glass navigation with an accessible mobile menu.
- Interactive, replayable missed-call, follow-up, and booking demonstration.
- Modular editorial and bento-grid marketing sections.
- Live ROI calculator with synchronized sliders and numeric inputs.
- Selectable local-business industries and personalized inquiry context.
- Keyboard-accessible FAQ accordion.
- Accessible demo and trial dialog with focus trapping, Escape dismissal, field validation, loading, error, and confirmation states.
- PostgreSQL-backed inquiry submissions, with server-side validation and per-email rate limiting.
- A public, multi-step revenue leak audit with safe homepage inspection, disclosed estimates, and stored reports.
- Privacy and terms pages, metadata, skip navigation, reduced-motion support, and a custom favicon.

## Inquiry flow

`POST /api/demo` validates and saves demo or free-trial inquiries to `demo_requests`. The form returns an inquiry reference after a successful database insert. All database access uses the Drizzle client from `@/db`. Sensitive configuration stays server-side; no external API keys are required.

The site records real inquiries. It does not send outbound emails, SMS, or telephone calls, process payments, or activate a live telephony account. Product conversations and charts are explicitly illustrative. Demo and trial inquiries are intended to be followed up by the business using the stored records. The calculator runs entirely in the browser; values are sent to the API only when a visitor submits an inquiry.

`/audit` is a public, auth-free audit flow. Its server endpoint validates and rate limits submissions, safely checks an optional public website homepage, calculates a disclosed call-recovery estimate, and saves the input and report to `audit_reports` before returning results. Apply the updated schema with `npx drizzle-kit push` (or execute `drizzle/0000_audit_reports.sql`) and configure the server-only `DATABASE_URL`. The audit does not email the report. Google Business Profile ratings and review data are not fetched because no authorized Google integration is configured. The in-memory rate limit is per running server process and should be replaced with a shared store for multi-instance production deployments.

### Audit API database setup

`POST /api/audit` uses the Drizzle PostgreSQL client in `src/db/index.ts`; it does not use the Supabase JavaScript client, Supabase REST API, or a Supabase service-role/anon key. Set `DATABASE_URL` in the Vercel project for every deployment environment that should accept audits (Production, Preview, and/or Development), then redeploy. For Supabase-hosted Postgres, use the database connection string from the Supabase dashboard, with its password URL-encoded as needed. Do not prefix this server-only variable with `NEXT_PUBLIC_`.

Create `audit_reports` by running `npx drizzle-kit push` against that same database, or execute `drizzle/0000_audit_reports.sql`. The table has a unique `idempotency_key`, required business/range/email fields, a required JSONB `report`, and a creation timestamp. The migration enables row-level security and defines no client policies. The API connects directly with the PostgreSQL role in `DATABASE_URL`, so that role must have permission to select and insert the table and must bypass/own its RLS policy (the Supabase database-owner connection does); a restricted role will need appropriate grants and RLS policies.

Responses include a stable `code` and request ID on errors. `DATABASE_URL_MISSING`, `AUDIT_TABLE_MISSING`, `AUDIT_SCHEMA_MISMATCH`, and `AUDIT_DATABASE_PERMISSION_DENIED` indicate configuration/schema/role setup problems; `AUDIT_DATABASE_CONFIGURATION`, `AUDIT_DATABASE_UNAVAILABLE`, or `AUDIT_STORAGE_FAILED` indicate connection or other storage failures. Match the response `requestId` to the structured Vercel function log; logs include the stage and safe database error code, never the connection string or submitted form data. Invalid input returns 400, rate limiting returns 429, and unexpected report-generation errors return 500. Optional public website checks are performed by the audit engine; an unreachable or unsafe website is reported as “Unable to verify” and does not by itself fail storage.

## Commands

- `npm run dev` — local development.
- `npm run build` — production build.
- `npm run lint` — ESLint.
- `npx playwright install chromium --with-deps` — install Chromium and its system dependencies for smoke tests.
- `npx playwright test` — browser smoke tests, with a running app and configured database. Use `PLAYWRIGHT_BASE_URL` to point to a different preview. The form test creates and then removes a clearly labeled test inquiry.
- `npx next typegen` — App Router route types.
- `npm exec tsc -- --noEmit --pretty false` — strict TypeScript validation.

## Structure

- `src/app/page.tsx` — modular landing-page composition.
- `src/components/` — each requested marketing section plus shared brand, modal, and CTA components.
- `src/app/globals.css` — shared palette tokens, typography, and component foundations.
- `src/lib/demo.ts` — shared form types, industry options, and validation.
- `src/app/api/demo/route.ts` — validated inquiry endpoint.
- `src/app/audit/page.tsx` — public audit route.
- `src/app/api/audit/route.ts` — validated, rate-limited audit endpoint.
- `src/lib/audit/` — audit input validation, types, and server-side report engine.
- `src/db/schema.ts` — Drizzle inquiry and audit-report schema.

Use `npx drizzle-kit push` after changing the database schema. The hosted preview uses the platform-managed production start and healthcheck.
