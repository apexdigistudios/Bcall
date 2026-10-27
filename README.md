# CallBackly

A responsive, fullstack missed-call recovery landing page built with Next.js App Router, TypeScript, Tailwind CSS, Geist fonts, Lucide Icons, and PostgreSQL through Drizzle ORM.

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
- Privacy and terms pages, metadata, skip navigation, reduced-motion support, and a custom favicon.

## Inquiry flow

`POST /api/demo` validates and saves demo or free-trial inquiries to `demo_requests`. The form returns an inquiry reference after a successful database insert. All database access uses the Drizzle client from `@/db`. Sensitive configuration stays server-side; no external API keys are required.

The site records real inquiries. It does not send outbound emails, SMS, or telephone calls, process payments, or activate a live telephony account. Product conversations and charts are explicitly illustrative. Demo and trial inquiries are intended to be followed up by the business using the stored records. The calculator runs entirely in the browser; values are sent to the API only when a visitor submits an inquiry.

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
- `src/db/schema.ts` — Drizzle inquiry schema.

Use `npx drizzle-kit push` after changing the database schema. The hosted preview uses the platform-managed production start and healthcheck.
