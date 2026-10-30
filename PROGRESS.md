# Build Progress

## Current status — 2026-10-30

- Phases 7 and 8 implementation and local acceptance checks are complete. Phase 9 launch preparation is documented, but no production deployment or launch has occurred.
- Phase 7 hardening includes metadata, robots/sitemap, security headers, accessibility, and privacy/security work. The current E2E scan reports no serious or critical axe violations on 11 public routes; security-header checks pass. Latest recorded simulated-mobile Lighthouse scores remain below the specification targets: homepage 64, contact 66.
- Phase 8 adds GitHub Actions CI and contribution guidance. Local validation passed: lint, typecheck, 28 unit tests across 10 files, production build, and the complete desktop/mobile Playwright suite (55 passed, 7 configured skips). The Playwright suite ran against the local development server; a hosted GitHub Actions run has not occurred.
- Phase 9 provides [the launch runbook](./docs/LAUNCH_RUNBOOK.md) and enforces a mandatory password change for seeded administrators. Production credentials, hosting, DNS, email/Turnstile/storage setup, backups and restore, Search Console, qualified privacy review, production smoke tests, and written launch approval remain operator tasks.
- No files are staged or committed. The project remains uncommitted on `phase/7-hardening`.

## Pre-Phase 4 summary — 2026-10-27

- Read the updated 836-line `ZAB_SHIPPING_BUILD_SPEC.md`; Sections 12–16 now supply the content, design system, redirects, and launch checklist that were previously missing.
- Synchronized `docs/BUILD_SPEC.md` with the updated source specification.
- Moved public routes into `src/app/(site)/` so future admin routes can have a separate layout without changing public URLs. Kept the root layout, error handling, and favicon at the `src/app/` level.
- Moved global CSS to `src/styles/globals.css` and scoped the public header, footer, and floating contact controls to the site route-group layout.
- Reconciled existing Phase 1–3 work with the new palette and fonts, company details, public copy, homepage storyboard, gallery placeholders, metadata, and complete legacy redirect inventory.
- Kept all public content in typed `content/` modules, including new contact, gallery, and privacy data. Unconfirmed statistics, membership, hubs, warehouse locations and promises remain hidden.
- Copied the supplied logo PNG unchanged to `public/images/branding/zab-shipping-llc-logo.png` and displayed it in the shared header. The original root-level file remains untouched; the browser selects a 2.9 KB responsive version on mobile.
- Server-rendered the homepage scenes and isolated animation setup in a small client component. Mobile uses `IntersectionObserver` and CSS transitions without loading GSAP; reduced-motion users get static content. GSAP scroll pinning remains lazy-loaded on desktop.
- Removed the unused global Sonner toaster from the root layout; add it when a page actually needs toast notifications.
- Darkened filled CTA and blue-scene surfaces to meet text-contrast requirements. Removed opacity-based text fades that caused contrast failures while scrolling pinned scenes.
- Docker is installed and running. The project Postgres 16 container is healthy and accepting connections.
- Git is initialized and Husky hooks are active. The global author identity is configured. No files have been staged or committed.
- Production browser validation passed: E2E (15 passed, 1 mobile-only skip), and all 17 legacy redirects returned HTTP 301.
- axe full-page scan reported zero violations on all 11 public routes at 1440px and 375px, including the expanded mobile menu; no horizontal overflow or browser errors were found.
- Latest simulated-mobile Lighthouse run: homepage Performance 64 / Accessibility 100; Contact Performance 66 / Accessibility 100. Both had CLS 0. Scores varied substantially between runs, especially Total Blocking Time; the 85+ homepage and 90+ inner-page performance targets remain unmet.
- Disabled automatic Next.js link prefetching on public internal links to reduce background RSC traffic. A production-browser check observed zero automatic `_rsc` prefetch requests after load, and client navigation still worked. A subsequent simulated-mobile homepage run scored 64 / Accessibility 100 (FCP 1.6s, LCP 3.8s, TBT 1.08s, CLS 0); this single noisy run does not establish that the performance target is met.
- Re-ran production E2E after the prefetch change: 15 passed, 1 mobile-only skip. Formatting and `git diff --check` also passed.
- Format, lint, typecheck, 5 unit tests, and production build (15 routes) passed.

## Phase 4: Database, enquiries API and forms — 2026-10-27

### Completed

- Started Phase 4 on `phase/4-database-enquiries-forms`, following the build spec's phase-branch workflow.
- Added Prisma ORM 7.10.1 with the PostgreSQL driver adapter, generated ESM client, Prisma config, and a development singleton. The documented Prisma 7 configuration is used because Prisma 8 was only a release candidate.
- Added the full database schema for admin users, enquiries, services, gallery items, settings, newsletter subscribers, rate-limit hits, and audit logs. Created and applied two migrations.
- Added idempotent seeding for one ADMIN account, five services, eight gallery placeholders, and fourteen settings. Existing records are preserved on reseed; configured contact details are confirmed and unverified claims remain unconfirmed.
- Added shared Zod validation, database-backed five-per-ten-minute request limits with hashed IP keys, expired-hit cleanup, and Turnstile verification. Missing Turnstile keys are skipped with a warning only in development; production configuration failures return a server error.
- Added enquiry and newsletter APIs plus a database health endpoint. Enquiries store a salted HMAC of the client IP, not the raw address.
- Added Resend delivery with a development-only console fallback for team and customer emails.
- Added accessible quote forms on `/contact` and in the desktop floating CTA dialog, plus a working newsletter form in the footer.
- Added integration coverage for persisted enquiries/subscriptions, validation errors, honeypot handling, the sixth-submission rate limit, health checks, and the floating quote dialog. Added axe checks for the forms and dialog.
- Added local development setup instructions to `README.md`. Created an ignored `.env.local` with a local database URL and generated development secrets; optional Resend and Turnstile keys remain empty.

### Validation

- `docker compose ps`: Postgres healthy; `pg_isready` accepts connections.
- `prisma migrate status`: database schema is up to date; two migrations applied.
- `npm run db:seed` completed repeatedly with stable counts: 1 admin, 5 services, 8 gallery items, 14 settings.
- `npm run lint`, `npm run typecheck`, `npm test`: passed; 11 unit tests.
- `npm run test:e2e`: passed; 30 passed and 2 expected mobile-only skips across desktop and mobile. Form integration checks verified the DB rows and hashed IP storage.
- axe found no violations on the contact page or when the quote dialog is open.
- `npm run build`: passed; public routes generated and API routes built dynamically.
- Client-bundle search found no `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` references in `.next/static`.
- Formatting and `git diff --check` passed.

### Pending / gated

- Configure production `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` before production form submissions.
- Phase 5 was approved and completed; see the Phase 5 report below.
- Phase 3 mobile Lighthouse performance targets remain unmet (latest homepage score: 64); this remains a separate pre-existing launch requirement.
- No files are staged or committed, and nothing has been merged to `main`.

## Phase 5: Admin panel — 2026-10-30

### Completed

- Implemented credentials sign-in with Auth.js, httpOnly session cookies, eight-hour sessions, role checks, login throttling, and `lastLoginAt` updates.
- Added live database checks for active users and password versions so password resets and access changes invalidate existing sessions.
- Added protected admin screens for the dashboard, enquiries, services, gallery, settings, and user management. STAFF is restricted from Users and Settings.
- Validated admin mutations with Zod and recorded create, update, and delete operations in `AuditLog`.
- Connected public service, gallery, statistics, and hub content to database records, retaining the specified static-content fallback when the database is empty.
- Added an additive migration for password-version session invalidation. The gallery UI supports editing and deletion; media upload was deferred to Phase 6.
- Fixed E2E synchronization to wait for server-action responses and persisted database state before assertions, preventing test cleanup from racing in-flight mutations.

### Validation

- `npm run lint`, `npm run typecheck`, and `npm test`: passed; 15 unit tests.
- `npm run test:e2e -- tests/e2e/admin.spec.ts`: passed; 11 tests and 5 expected mobile skips across Chromium desktop and mobile. The mobile skips are admin mutation scenarios explicitly configured to run desktop-only.
- `npx prisma migrate status`: database schema is up to date; 3 migrations found.
- `npm run build`: passed with `NEXTAUTH_URL=http://127.0.0.1:3000` configured for the build process. Set `NEXTAUTH_URL` to the canonical deployment origin in production.
- Postgres reports healthy. E2E cleanup verification found no leftover test admins, enquiries, or gallery items.
- Formatting check passed for the updated Playwright test.

### Pending / gated

- Phase 6 was approved and completed; see the report below.
- The full cross-project E2E failures recorded below were subsequently resolved; see the Phase 8 report in the current-status summary.
- Phase 3 mobile Lighthouse performance targets remain unmet; latest recorded homepage performance is 64.
- No production HTTPS browser run was performed for Phase 5; admin acceptance coverage ran against the local Next.js development server.
- The project remains uncommitted and unstaged on `phase/6-media-gallery`; the phase branch has no `main` commit/ref to branch from.

## Phase 6: Media and gallery — 2026-10-30

### Completed

- Added local-disk, Vercel Blob, and Cloudflare R2 storage drivers behind `StorageDriver`; local uploads are ignored by Git.
- Added an authenticated gallery upload endpoint that caps files at 8 MB, verifies JPEG/PNG/WebP bytes, rejects oversized images, strips metadata, resizes, generates WebP, and stores dimensions and blur placeholders.
- Added an unpublished-by-default admin upload flow, audited gallery ordering, and storage cleanup on deletion.
- Added public category filters and a responsive image gallery with a keyboard/touch lightbox, focus trap and return, captions, and dimensioned `next/image` elements.
- Added unit and browser coverage for image validation, optimized upload, publication, public rendering, deletion, reordering, filters, and lightbox behavior.
- Applied the gallery metadata migration; the Prisma schema is up to date with four migrations.
- Resolved the nested Zod production advisory using npm's direct-dependency override syntax; the resolved tree uses Zod 4.6.7.

### Validation

- `npm run lint`, `npm run typecheck`, and `npm test`: passed; 18 unit tests.
- Focused `gallery-media.spec.ts`: all four desktop and mobile upload/reorder tests passed across the complete run and an isolated mobile rerun.
- Focused public gallery filter/lightbox test: passed in desktop and mobile projects (2 tests).
- `npm run build` with `NEXTAUTH_URL=http://127.0.0.1:3000`: passed; all 29 static/dynamic route outputs generated.
- `prisma migrate status`: database schema is up to date; four migrations found.
- `npm ls zod --all` and `npm audit --omit=dev`: passed; one resolved Zod version and zero production vulnerabilities.
- Prettier check passed for the changed source, test, package, and Markdown files. `.env.example`, Prisma schema, and SQL were excluded because no parser is configured for those formats.
- Post-test database inspection found no leftover Phase 6 gallery items or gallery-test admin accounts.
- Historical full `npm run test:e2e`: 38 passed, 9 failed, and 7 skipped across desktop/mobile. Those test-stability issues were subsequently resolved; see the current-status summary for the latest full-suite result.

### Pending / gated

- Vercel Blob and R2 uploads have not been smoke-tested because provider credentials are not configured; local storage was exercised.
- Phase 7 implementation is complete following approval. Accessibility and security-header checks pass; Lighthouse performance targets and production-browser launch checks remain outstanding.
- No files are staged or committed.

## Phase 0: Preflight and repository

### Completed

- Added `.gitignore`, `.env.example`, `docker-compose.yml`, and this progress log.
- Added local Postgres configuration with a health check and optional Mailpit profile.
- Added a README with setup instructions.
- Copied the build spec to `docs/BUILD_SPEC.md`.

### Pending / blocked

- Initial repository commit: Git author identity is configured, but no commit has been created. Phase 4 is on `phase/4-database-enquiries-forms`.
- Postgres startup and health verification: completed with Docker Compose; the local Postgres 16 service is accepting connections.

### Commands run and results

- `node -v`: `v20.18.0`
- `npm -v`: `10.8.2`
- `git --version`: `2.39.5`.
- `git init -b main`: passed; repository initialized on `main`. Git is for version history and the spec's per-phase branches/commits; no files have been staged or committed.
- `npm run prepare`: passed; `core.hooksPath` is `.husky/_`.
- `docker --version`: Docker 29.9.2.
- `docker compose version`: Docker Compose 5.6.1.
- `docker info --format '{{.ServerVersion}}'`: 29.9.2; Docker engine is running.
- `docker compose up -d postgres`: passed; `docker compose exec -T postgres pg_isready -U zab -d zab` reports accepting connections.
- Node.js `v24.15.0` was used via an isolated npm package for build/test checks; the system default remains `v20.18.0`.

### Decisions and open questions

- Continued with non-Docker Phase 0 setup at the user's request.
- Copied the build spec to `docs/BUILD_SPEC.md`.
- `.env.example` uses local dummy Postgres credentials that match `docker-compose.yml`. Do not use these credentials in production.

## Phase 1: Foundation and design system

### Completed

- Scaffolded Next.js App Router with TypeScript, Tailwind CSS, and the `@/*` import alias.
- Installed the specified form, animation, icon, validation, formatting, UI, and test dependencies.
- Added strict TypeScript with `noUncheckedIndexedAccess`.
- Added shadcn/Radix primitives, shared layout components, accessible skip link, and responsive navigation.
- Added the refreshed Section 13 CSS token palette, with self-hosted Archivo display and DM Sans text fonts.
- Added the supplied ZAB Shipping LLC logo to the shared header while preserving the original upload.
- Added typed company/navigation/service content with no invented address, email, or unconfirmed business claims.
- Added Vitest and Playwright smoke tests for desktop and 375px mobile layouts.

### Pending / blocked

- The listed `db:*` scripts will become executable when Prisma is added in Phase 4.

### Validation

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 1 test passed.
- `npm run build`: passed.
- `npm run test:e2e`: 2 tests passed (desktop 1440px and mobile 375px).
- Node 24.15.0 was invoked via npm for validation because the system default Node 20.18.0 is below the package engine floor and several dependencies' engine requirements.

### Decisions and open questions

- Applied the Section 13 provisional design palette. The supplied logo is now in the shared header; exact logo-matched palette adjustments remain open for ZAB review.
- Pinned `@hookform/resolvers` to stable `5.2.2` because latest `6.0.0` had an incompatible optional `effect` peer dependency during install.
- Docker/Postgres is available locally and Phase 4 is complete on its working branch; hosted Neon is not needed for local development.

## Phase 2: Content and static inner pages

### Completed

- Added typed home, about, service, SEO, and confirmation-flag content files under `content/`.
- Added `/about`, all five `/services/[slug]` pages, `/gallery`, `/contact`, and `/privacy`.
- Added shared page banners, service navigation, feature lists, tags, confirmed-only stats, and CTA components under `src/components/content/`.
- Added local SVG illustration placeholders under `public/images/placeholders/`; no remote images are used.
- Added page metadata with canonicals and Open Graph/Twitter fields.
- Added branded not-found and error pages.
- Added the complete legacy URL map from Section 12.4, using HTTP 301.
- Removed unused create-next-app sample SVG assets.

### Validation

- `npm run format`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 5 tests passed, including commodity filtering and hiding unconfirmed statistics.
- `npm run build`: passed; 15 routes generated.
- `npm run test:e2e`: 13 passed and 1 mobile-only skip across desktop and mobile, including all ten public routes and 17 HTTP 301 redirects.

### Review needed

- The updated Section 12 page content and redirect map have been incorporated into the typed content layer and Next.js redirects.
- The supplied logo is used in the shared header; Section 13's palette remains provisional pending ZAB's brand review.
- The privacy policy remains a draft requiring legal review.
- No unconfirmed statistics, certifications, memberships, hub/warehouse locations, response promises, or office hours are displayed.

## Phase 3: Animated homepage story

### Completed

- Added the nine-scene storyboard from Section 12.1 using GSAP and ScrollTrigger, with pinned scenes on desktop and lightweight native reveal animations on mobile.
- Disabled the animations and pinning when reduced motion is requested.
- Lazy-loaded GSAP after the first animation frame and reverted its match-media context when the homepage unmounts.
- Server-rendered the scene content; kept desktop GSAP in an isolated client component and uses native intersection observation/CSS transitions for mobile. Reduced-motion users receive static content without loading GSAP.
- Added the Why Choose ZAB section and service overview cards below the nine scenes.
- Added original reach-stacker, truck, top-down container ship, plane, warehouse, document, RORO, hazard and network illustrations.
- Added confirmed-only statistics and hub markers; the proof scene currently shows neutral network copy because none are confirmed.
- Used the active scene's foreground color for its illustration so artwork remains visible on both dark and light scenes.
- Updated all public page copy, metadata, contact details and the legal-review privacy draft to match the refreshed spec.
- Added eight clearly labelled gallery placeholder entries and filterable commodity tags with icons.
- Replaced provisional redirects with all 17 old-site URL mappings in Section 12.4.

### Validation

- `npm run format`, `npm run lint`, and `npm run typecheck`: passed.
- `npm test`: 5 tests passed.
- `npm run build`: passed; 15 routes generated.
- `npm run test:e2e` against production: 15 passed, 1 mobile-only skip. The suite checks all ten public content routes, all 17 HTTP 301 aliases, hidden unconfirmed claims, desktop/mobile homepage scenes, reduced motion, responsive animation-mode changes, browser console/runtime errors, and desktop client-navigation cleanup.
- axe full-page scans after scrolling each route: zero violations on all 11 public routes at 1440px and 375px, including the expanded mobile menu; no horizontal overflow or browser errors.
- Lighthouse (simulated mobile, final production build): `/` scored Performance 64, Accessibility 100 (FCP 1.0s, LCP 3.4s, TBT 1.92s, CLS 0); `/contact` scored Performance 66, Accessibility 100 (FCP 0.9s, LCP 3.4s, TBT 1.48s, CLS 0). Scores varied across runs (home 63–72, contact 66–86), especially due to Total Blocking Time. Performance acceptance thresholds remain unmet.
- Disabled automatic prefetch on public internal links; manual production validation saw no automatic `_rsc` requests and confirmed client navigation works. Latest homepage score after that change remained 64 (Accessibility 100; FCP 1.6s, LCP 3.8s, TBT 1.08s, CLS 0), so the performance target is still unmet.
- Re-ran production E2E after the link change: 15 passed, 1 mobile-only skip; formatting and whitespace checks passed.
- Browser-checked the homepage at mobile and desktop viewport sizes.

### Review needed / pending

- The homepage storyboard and design system now follow the refreshed spec; ZAB should still review the draft content and final visual treatment.
- Lighthouse confirms accessibility targets, but mobile performance targets remain unmet and vary between runs; further optimization and measurement are still needed.
- The redirect map now matches the old-site inventory provided in Section 12.4.
- Git initialization and Husky hooks are active, with author identity configured. Phases 4 and 5 are complete on their working branches but uncommitted. Docker/Postgres is available and healthy.
