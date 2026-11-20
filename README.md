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
- A public, multi-step revenue leak audit with safe homepage inspection, OpenStreetMap lookup, disclosed estimates, and printable reports.
- Privacy and terms pages, metadata, skip navigation, reduced-motion support, and a custom favicon.

## Inquiry flow

`POST /api/demo` validates and saves demo or free-trial inquiries to `demo_requests`. The form returns an inquiry reference after a successful database insert. All database access uses the Drizzle client from `@/db`. Sensitive configuration stays server-side; no external API keys are required.

The site records real inquiries. Demo and trial submissions do not send outbound emails, SMS, or telephone calls, process payments, or activate a live telephony account. Product conversations and charts are explicitly illustrative. Demo and trial inquiries are intended to be followed up by the business using the stored records. The calculator runs entirely in the browser; values are sent to the API only when a visitor submits an inquiry.

## Missed-call SMS

The dashboard can register a Sender ID and dispatch missed-call follow-ups through Sailup. Set `SAILUP_API_KEY` in the server environment; it is never sent to the browser. Sender IDs are fetched from Sailup, and only an approved, active sender can send. Registration and manual SMS requests require a signed-in Supabase user. Manual dispatch is bound to an existing call event and its captured Ghanaian phone number. When a paired Android device records a missed call, the server attempts the same follow-up automatically if an active sender is available. Sender registration status is shown on `/dashboard/templates` and `/dashboard`.

SMS rate limits and duplicate-dispatch protection are currently held in process memory. Multi-instance deployments should use a shared rate limiter and durable dispatch records before relying on cross-instance limits or deduplication. Sailup failures are reported without rolling back call ingestion.

WhatsApp actions require `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` on the server. The current action opens a prefilled `wa.me` chat for the signed-in operator; it does not send a WhatsApp Cloud API message automatically.

`/audit` is a public, auth-free, three-step tool. `POST /api/audit` validates the request with Zod, checks the public website and OpenStreetMap in parallel, and calculates all scores, findings, recommendations, and financial estimates deterministically on the server. No AI or LLM service is called. The report is not stored; it can be printed or saved as PDF through the browser print dialog.

Website checks use a bounded public homepage fetch with HTTP/HTTPS, redirect, timeout, response-size, and private-address safeguards. OpenStreetMap uses one Nominatim search per audit and requires `OSM_USER_AGENT` set to a contactable application identifier, for example `RevenueLeakAudit/1.0 (contact: you@example.com)`. Requests are limited to at most one per second per server process; requests arriving sooner are skipped and marked unavailable. If its environment variable is missing or the request fails, the report marks the listing unavailable and continues.

Missed-call, website, and reputation estimates use the explicit defaults and formulas shown in the report; every displayed estimate is a low/expected/high range, with a 50% of monthly-revenue cap. Rating and review count are optional self-reported inputs because OpenStreetMap does not provide them. Reports are estimates, not verified losses or guarantees. The audit rate limit is in-memory (five requests per IP per hour per process); multi-instance production deployments should use a shared limiter.

Set `OSM_USER_AGENT` in `.env.local` for local development and in the Vercel environment(s) where the audit runs. The audit does not require an AI key or make LLM requests. The current pipeline does not connect to Google Business Profile APIs; it uses only OpenStreetMap listing signals and clearly labels unverified Google profile data.

## Commands

- `npm run dev` — local development.
- `npm run build` — production build.
- `npm run lint` — ESLint.
- `npx playwright install chromium --with-deps` — install Chromium and its system dependencies for smoke tests.
- `npx playwright test` — browser and audit tests. The full site suite needs a running app and configured database for inquiry/health checks; the audit logic itself does not use a database. Use `PLAYWRIGHT_BASE_URL` to point to a different preview.
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
- `src/app/api/sailup/senders/route.ts` and `src/app/api/sms/send/route.ts` — authenticated Sender ID registration/status and missed-call SMS dispatch.
- `src/lib/sailup.ts` and `src/lib/sms-followup.ts` — server-only Sailup client, channel checks, and shared automatic/manual SMS follow-up logic.
- `src/lib/schema.ts`, `src/lib/website.ts`, `src/lib/osm.ts`, `src/lib/leak.ts`, and `src/lib/report.ts` — audit validation, public checks, deterministic estimates and findings, and report assembly.
- `src/db/schema.ts` — Drizzle inquiry and device schema.

Use `npx drizzle-kit push` after changing the database schema. The hosted preview uses the platform-managed production start and healthcheck.
