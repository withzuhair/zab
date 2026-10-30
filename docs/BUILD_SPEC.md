# ZAB Shipping LLC: Full-Stack Website Build Specification

**Audience:** an AI coding agent (VS Code agent mode, Google Antigravity, Claude Code, Cursor, or similar) and the human reviewing its work.
**Goal:** rebuild zabshipping.com as a modern animated full-stack site with a backend, a database and an admin panel, built in small, verifiable phases so nothing breaks.

---

## 0. How to use this file

1. Create an empty folder, for example `zab-shipping/`, and open it in your IDE.
2. Save this file in it as `AGENTS.md` (many agentic IDEs read this name automatically). Keep a second copy as `docs/BUILD_SPEC.md`.
3. Paste the **Kickoff prompt** from Section 14 into the agent.
4. After each phase the agent stops, reports, and waits for you to say **"approved, next phase"**.

The agent installs everything itself with `npm`, `npx` and `docker compose`. No manual downloads are needed. It needs internet access to the npm registry and Docker Hub.

---

## 1. Operating rules for the agent (read first, obey always)

1. **One phase at a time.** Never start a phase until the human has approved the previous one.
2. **Branch per phase.** Create `phase/N-name` from `main`, work there, and merge to `main` only after approval. Tag each merge `phase-N-complete`.
3. **Small commits** using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
4. **Never edit outside the current phase's scope.** If a change in an earlier phase is needed, say so and ask first.
5. **Never delete or overwrite** user-provided files (`/public/images/user/`, `.env*`, `content/` edits made by the human).
6. **Run the phase's acceptance checks** before reporting. Report the actual command output, not a claim that it passed.
7. **Never invent business facts.** Statistics, certifications, memberships, hub locations, warehouse locations, response-time promises and office hours are unconfirmed. Render them from `content/` data flagged `confirmed: false`, and show nothing or a neutral placeholder on the public site until the human sets `confirmed: true`. See Section 12.
8. **Secrets stay out of git.** Only `.env.example` is committed, with dummy values.
9. **Use current stable versions.** Run `npm view <pkg> version` or read the package docs before installing, let `package-lock.json` pin the result, and do not guess version numbers from memory. If a documented API differs from this spec, follow the official docs and note the difference in `PROGRESS.md`.
10. **Keep `PROGRESS.md` updated** at the end of every phase: what was built, commands run, results, open questions, decisions made.
11. **If blocked or unsure, stop and ask.** Do not work around a failure by disabling tests, lint rules, type checks or security features.
12. **Accessibility, performance and security are requirements, not extras.** They are checked in every phase's acceptance list.

---

## 2. Project summary

ZAB Shipping LLC is a Dubai-based freight forwarding and logistics company. Services: ocean freight and cross trade, air freight (UAE and GCC), warehousing and distribution, freight forwarding, and specialised services (consolidation, RORO, dangerous goods, customs clearance).

The old site is a static template with forms that submit nowhere. The new site must:

- Present the services with an animated, scroll-driven homepage (dark and light scenes, truck, container ship, plane).
- Receive quote and contact enquiries, store them in a database, and email the team.
- Give staff a secure admin panel to manage enquiries, services, gallery and site settings.
- Rank well in search, load fast, work on mobile, and meet WCAG AA.

---

## 3. Technology stack

| Concern                        | Choice                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Framework                      | **Next.js** (App Router) with **TypeScript** (strict)                                                             |
| Runtime                        | Node.js current LTS                                                                                               |
| Styling                        | **Tailwind CSS** plus CSS variables for design tokens                                                             |
| UI primitives                  | **shadcn/ui** (Radix based) for forms, dialogs, tables in the admin                                               |
| Animation                      | **GSAP** with the **ScrollTrigger** plugin; `prefers-reduced-motion` respected                                    |
| Icons                          | **lucide-react**                                                                                                  |
| Illustrations                  | Hand-written inline **SVG** components (truck, container stack, ship, plane, crane)                               |
| Fonts                          | `next/font` (Google Fonts, self-hosted at build time)                                                             |
| Database                       | **PostgreSQL**                                                                                                    |
| ORM and migrations             | **Prisma**                                                                                                        |
| Validation                     | **Zod** (shared by client forms and server routes)                                                                |
| Forms                          | **React Hook Form** with `@hookform/resolvers/zod`                                                                |
| Admin auth                     | **Auth.js** (next-auth) Credentials provider, passwords hashed with **bcryptjs**, role based (ADMIN, STAFF)       |
| Email                          | **Resend** (dev fallback: log to console)                                                                         |
| Spam protection                | Honeypot field, **Cloudflare Turnstile**, database-backed rate limiting                                           |
| File storage (gallery uploads) | Local disk in development; **Vercel Blob** or **Cloudflare R2** in production behind one storage interface        |
| Image handling                 | `next/image`, **sharp**                                                                                           |
| Analytics                      | **Plausible** (script added only if `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set)                                        |
| Testing                        | **Vitest** and **Testing Library** (unit), **Playwright** (end-to-end, accessibility with `@axe-core/playwright`) |
| Code quality                   | ESLint, Prettier, `tsc --noEmit`, Husky with lint-staged                                                          |
| Local services                 | **Docker Compose** (Postgres, optional Mailpit for email testing)                                                 |
| CI                             | **GitHub Actions** (lint, typecheck, test, build)                                                                 |
| Hosting (recommended)          | App on **Vercel**, database on **Neon** (or Supabase Postgres). Alternative: one VPS with Docker                  |

Everything above is installed by the agent. Do not add libraries that are not listed here without asking.

---

## 4. Repository structure (target)

```
zab-shipping/
├─ AGENTS.md                  # this file
├─ PROGRESS.md                # agent's running log
├─ docs/BUILD_SPEC.md
├─ .env.example
├─ docker-compose.yml
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ content/                   # all public copy as typed data (Section 12)
│  ├─ site.ts                 # company, contact, nav, footer
│  ├─ home.ts
│  ├─ about.ts
│  ├─ services.ts
│  ├─ seo.ts
│  └─ confirm-flags.ts
├─ public/
│  ├─ images/placeholders/    # generated placeholders
│  ├─ images/user/            # real photos the human adds (never overwrite)
│  ├─ robots.txt
│  └─ favicon + og images
├─ src/
│  ├─ app/
│  │  ├─ (site)/              # public pages
│  │  │  ├─ page.tsx
│  │  │  ├─ about/page.tsx
│  │  │  ├─ services/[slug]/page.tsx
│  │  │  ├─ gallery/page.tsx
│  │  │  ├─ contact/page.tsx
│  │  │  └─ privacy/page.tsx
│  │  ├─ admin/               # protected admin panel
│  │  ├─ api/
│  │  │  ├─ enquiries/route.ts
│  │  │  ├─ newsletter/route.ts
│  │  │  └─ health/route.ts
│  │  ├─ sitemap.ts
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ layout/              # Header, Footer, FloatingCTA, WhatsAppButton
│  │  ├─ scenes/              # scroll scenes for the home page
│  │  ├─ illustrations/       # SVG components
│  │  ├─ forms/               # QuoteForm, NewsletterForm
│  │  ├─ admin/
│  │  └─ ui/                  # shadcn components
│  ├─ lib/
│  │  ├─ db.ts                # Prisma client singleton
│  │  ├─ auth.ts
│  │  ├─ email.ts
│  │  ├─ storage.ts           # storage interface + drivers
│  │  ├─ rate-limit.ts
│  │  ├─ turnstile.ts
│  │  ├─ validation.ts        # Zod schemas
│  │  └─ seo.ts
│  └─ styles/globals.css
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ .github/workflows/ci.yml
```

---

## 5. Environment variables

Create `.env.example` with these keys (dummy values) and a real `.env.local` that is git-ignored.

```
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://zab:zab@localhost:5432/zab?schema=public

# Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_URL=http://localhost:3000

# Initial admin (used only by the seed script)
SEED_ADMIN_EMAIL=admin@zabshipping.com
SEED_ADMIN_PASSWORD=change-me-immediately

# Email
RESEND_API_KEY=
EMAIL_FROM="ZAB Shipping <no-reply@zabshipping.com>"
ENQUIRY_NOTIFY_TO=admin@zabshipping.com

# Spam protection
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Storage
STORAGE_DRIVER=local            # local | vercel-blob | r2
BLOB_READ_WRITE_TOKEN=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

The app must start in development with every optional value empty: email logs to the console, Turnstile is skipped, storage uses local disk.

---

## 6. Database design

Implement in `prisma/schema.prisma`. Adjust syntax to the installed Prisma version, keeping the model intent.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { ADMIN STAFF }
enum EnquiryStatus { NEW CONTACTED QUOTED WON LOST SPAM }
enum ServiceType { OCEAN AIR WAREHOUSING CUSTOMS RORO_PROJECT DANGEROUS_GOODS NOT_SURE }
enum GalleryCategory { OCEAN AIR WAREHOUSE ROAD OTHER }

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         Role     @default(STAFF)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  auditLogs    AuditLog[]
}

model Enquiry {
  id            String        @id @default(cuid())
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  fullName      String
  company       String?
  email         String
  phone         String?
  serviceType   ServiceType
  origin        String?
  destination   String?
  cargoType     String?
  weightVolume  String?
  message       String
  consent       Boolean
  status        EnquiryStatus @default(NEW)
  internalNotes String?
  sourcePage    String?
  ipHash        String?       // salted hash, never the raw IP
  userAgent     String?
  @@index([status, createdAt])
  @@index([email])
}

model Service {
  id         String  @id @default(cuid())
  slug       String  @unique
  title      String
  headline   String
  summary    String
  body       String           // markdown
  highlights String[]
  sortOrder  Int     @default(0)
  published  Boolean @default(true)
  updatedAt  DateTime @updatedAt
}

model GalleryItem {
  id         String          @id @default(cuid())
  title      String
  caption    String?
  alt        String
  category   GalleryCategory @default(OTHER)
  imageUrl   String
  width      Int?
  height     Int?
  sortOrder  Int             @default(0)
  published  Boolean         @default(true)
  createdAt  DateTime        @default(now())
}

model Setting {            // company details and stats editable in admin
  key       String   @id
  value     Json
  confirmed Boolean  @default(false)
  updatedAt DateTime @updatedAt
}

model NewsletterSubscriber {
  id          String   @id @default(cuid())
  email       String   @unique
  createdAt   DateTime @default(now())
  unsubscribed Boolean @default(false)
}

model RateLimitHit {       // simple database-backed rate limiting
  id        String   @id @default(cuid())
  key       String
  createdAt DateTime @default(now())
  @@index([key, createdAt])
}

model AuditLog {
  id        String    @id @default(cuid())
  userId    String?
  user      AdminUser? @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String?
  meta      Json?
  createdAt DateTime  @default(now())
}
```

---

## 7. API contract

| Method and path                        | Purpose                                                                                                               | Auth                                            | Notes                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/enquiries`                  | Create an enquiry from the quote form                                                                                 | Public                                          | Zod validation, honeypot, Turnstile, rate limit (5 per IP hash per 10 minutes), stores row, emails team and sends the customer a confirmation |
| `POST /api/newsletter`                 | Subscribe an email                                                                                                    | Public                                          | Zod, rate limit, upsert                                                                                                                       |
| `GET /api/health`                      | Health check for hosting and CI                                                                                       | Public                                          | Returns `{ ok: true }` and checks database connectivity                                                                                       |
| Admin server actions or `/api/admin/*` | Enquiries list, filter, update status, add notes, export CSV; services CRUD; gallery CRUD and upload; settings; users | ADMIN or STAFF (settings and users: ADMIN only) | Every mutation writes an `AuditLog` row                                                                                                       |

Error format for all JSON endpoints: `{ "ok": false, "error": { "code": "VALIDATION" | "RATE_LIMIT" | "SPAM" | "SERVER", "message": "...", "fields"?: {...} } }`. Never leak stack traces or database details.

---

## 8. Build phases

Each phase has: **Scope**, **Tasks**, **Acceptance checks**, **Stop and report**. Do not skip ahead.

Standard command set (add as npm scripts in Phase 1): `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format`, `test` (Vitest), `test:e2e` (Playwright), `db:migrate`, `db:seed`, `db:studio`.

### Phase 0: Preflight and repository

**Scope:** tooling only. No application code.

Tasks:

1. Verify `node -v` (current LTS), `npm -v`, `git --version`, `docker --version`. Report anything missing and stop if Node or git is absent.
2. `git init`, set default branch `main`, add `.gitignore` (node_modules, `.next`, `.env*` except `.env.example`, `public/images/user` is NOT ignored, uploads folder ignored).
3. Create `PROGRESS.md`, `docs/BUILD_SPEC.md`, `.env.example` (Section 5), `README.md` with setup steps.
4. Create `docker-compose.yml` with a `postgres` service (volume, healthcheck, credentials matching `.env.example`) and an optional `mailpit` service.
5. Run `docker compose up -d` and confirm Postgres is healthy.
6. First commit on `main`, then create branch `phase/1-foundation`.

Acceptance checks:

- `docker compose ps` shows Postgres healthy.
- `git log` shows the initial commit; `.env.local` is not tracked.

Stop and report.

### Phase 1: Foundation and design system

**Scope:** project scaffold, tokens, layout shell. No real page content yet.

Tasks:

1. Scaffold with `npx create-next-app@latest` (TypeScript, ESLint, Tailwind, App Router, `src/` directory, import alias `@/*`) into the current folder without destroying existing files. If it refuses because the folder is not empty, scaffold in a temp folder and move files in, preserving `AGENTS.md`, `docs/`, `.env.example`, `docker-compose.yml`.
2. Install: `gsap`, `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `clsx`, `tailwind-merge`; dev: `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@axe-core/playwright`. Initialise shadcn/ui with the CLI (`npx shadcn@latest init`) and add: button, input, textarea, select, label, checkbox, dialog, table, badge, tabs, dropdown-menu, sonner (toasts).
3. Strict TypeScript (`"strict": true`, `noUncheckedIndexedAccess`).
4. Design tokens in `globals.css` as CSS variables, mapped into Tailwind: see Section 13. Light and dark scene tokens both defined.
5. Fonts with `next/font`: a bold display face and a clean text face (see Section 13).
6. Build layout components: `Header` (sticky, services mega menu, mobile drawer), `Footer` (quick links, services links, contact details, newsletter box placeholder), `FloatingCTA` (right-edge "Get a Quote" tab), `WhatsAppButton` (link `https://wa.me/971569445296`), skip-to-content link.
7. Content layer skeleton: `content/site.ts` with company name, address, phone, email, nav and footer links, exactly as in Section 12.
8. Prettier, ESLint, Husky pre-commit (lint-staged), Vitest config with one passing sample test, Playwright config with one smoke test that loads `/`.
9. Scripts added to `package.json`.

Acceptance checks:

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass.
- `npm run test:e2e` smoke test passes.
- Header and footer render on mobile (375px) and desktop (1440px), keyboard navigable, visible focus rings.
- No hard-coded colours outside tokens.

Stop and report with screenshots or a description of the layout shell.

### Phase 2: Content and static inner pages

**Scope:** all inner pages rendered from the `content/` layer, with placeholder images. No database yet.

Tasks:

1. Fill `content/services.ts`, `content/about.ts`, `content/seo.ts`, `content/confirm-flags.ts` from Section 12 (verbatim copy; flagged items marked `confirmed: false`).
2. Build routes: `/about`, `/services/[slug]` (slugs: `ocean-freight`, `air-freight`, `warehousing`, `freight-forwarding`, `specialised`), `/gallery` (static placeholder grid for now), `/contact` (page shell, form comes in Phase 4), `/privacy`.
3. Shared components: `PageBanner` (title plus breadcrumb), `ServiceSidebar`, `FeatureList`, `CommodityTags`, `StatStrip` (renders only confirmed stats), `CTASection`.
4. Generate placeholder images as SVG or gradient components in `public/images/placeholders/`. Never download or hotlink third-party images.
5. Per-page metadata from `content/seo.ts` (title, description, canonical, Open Graph).
6. `not-found.tsx` and `error.tsx` pages in brand style.
7. Redirect map in `next.config` for old URLs (Section 12.4).

Acceptance checks:

- All routes return 200; old URLs 301 to new ones.
- One `h1` per page, logical heading order, every image has `alt`.
- Unconfirmed claims do not render publicly (unit test that scans rendered content for `confirmed: false` items).
- Lint, typecheck, test, build pass.

Stop and report.

### Phase 3: Home page scroll story

**Scope:** `/` only.

Tasks:

1. Register GSAP ScrollTrigger in a client-only hook; clean up on unmount; no layout shift.
2. Build the SVG illustration components: `ContainerStack`, `ReachStacker` (container handler), `Truck`, `Ship` (top-down, coloured containers), `Plane`, `Warehouse`, `DocStack`.
3. Build scenes in `components/scenes/` following the storyboard in Section 12.1 (nine scenes): Arrival, Everything Under One Roof, Ocean, Air, Warehousing, Customs, Specialised, Proof, Call to action. Alternate light and dark backgrounds with large curved SVG shape transitions.
4. Scroll behaviour: pinned scenes with vehicles moving on scroll (truck crosses the screen, ship drifts, plane crosses), text reveals, counters that count once. Keep each scene independently testable.
5. **Reduced motion:** when `prefers-reduced-motion: reduce`, render the same scenes as static stacked sections with no pinning or movement.
6. **Mobile fallback:** below 768px use simplified animations (no heavy pinning) to keep scrolling smooth.
7. Lazy-load GSAP and heavy scene code after first paint where possible.

Acceptance checks:

- Lighthouse (mobile) Performance 85+ and Accessibility 95+ on `/`; Cumulative Layout Shift under 0.1.
- No console errors; no memory leaks when navigating away and back (ScrollTrigger instances killed).
- Content is fully readable with JavaScript animations disabled.
- Lint, typecheck, test, build pass; Playwright test scrolls the page and asserts each scene heading becomes visible.

Stop and report.

### Phase 4: Database, enquiries API and forms

**Scope:** backend for the public forms.

Tasks:

1. Install `prisma` (dev) and `@prisma/client`. Write the schema from Section 6. Run `npx prisma migrate dev --name init`. Create `lib/db.ts` singleton.
2. `prisma/seed.ts`: create the initial admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (hash with bcryptjs), seed `Service` rows from `content/services.ts`, seed `Setting` rows (contact details confirmed, stats unconfirmed), seed gallery placeholders. Seed must be idempotent.
3. `lib/validation.ts`: Zod schemas for the quote form and newsletter.
4. `POST /api/enquiries`: validate, check honeypot, verify Turnstile (skip with a logged warning when keys are empty in development only), rate-limit, hash IP with a salt derived from `AUTH_SECRET`, store, send emails, return the standard JSON format.
5. `lib/email.ts` with Resend and a console fallback; templates for team notification and customer confirmation.
6. `QuoteForm` component (fields in Section 12.3) with accessible labels, inline errors, loading state, success and failure messages. Place it on `/contact` and as a compact variant opened by the floating "Get a Quote" tab.
7. Newsletter form in the footer calling `/api/newsletter`.
8. `GET /api/health`.
9. Unit tests for validation and rate limiting; integration test for `/api/enquiries` against the Docker Postgres.

Acceptance checks:

- Submitting the form in the browser creates a row (verify with `npx prisma studio` or a query) and an email appears in Mailpit or the console.
- Invalid input returns field errors; filled honeypot is silently discarded; sixth submission in 10 minutes returns `RATE_LIMIT`.
- No raw IP addresses stored; no secrets in client bundles (search the build output for `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY`).
- Lint, typecheck, test, build pass; Playwright test submits the form end to end.

Stop and report.

### Phase 5: Admin panel

**Scope:** `/admin` and its server logic.

Tasks:

1. Install `next-auth` (Auth.js) and `bcryptjs`. Credentials sign-in at `/admin/login`; session cookies httpOnly, secure in production; middleware protects `/admin/*`.
2. Roles: ADMIN (everything), STAFF (enquiries, gallery, services; no users, no settings).
3. Login hardening: generic error messages, throttle failed attempts using `RateLimitHit`, `lastLoginAt` updated.
4. Screens:
   - **Dashboard:** counts of new enquiries, enquiries this week, status breakdown.
   - **Enquiries:** table with search, filter by status and service, sort, pagination; detail view with status change, internal notes, reply link (`mailto:`), CSV export.
   - **Services:** edit headline, summary, body (markdown), highlights, order, published.
   - **Gallery:** upload (Phase 6 supplies storage), edit title, caption, alt, category, order, publish toggle, delete.
   - **Settings:** company contact details, statistics (each with a `confirmed` toggle), hub locations.
   - **Users (ADMIN only):** create, deactivate, reset password, change role.
5. All mutations validated with Zod and recorded in `AuditLog`.
6. Public pages read services, gallery and settings from the database (falling back to `content/` if the database is empty).

Acceptance checks:

- Unauthenticated access to any `/admin` route redirects to login; STAFF cannot reach Users or Settings (E2E tests).
- Changing a service in admin changes the public page after revalidation.
- Toggling a stat to `confirmed: true` makes it appear on the public site.
- Audit log rows exist for create, update and delete actions.
- Lint, typecheck, test, build pass.

Stop and report.

### Phase 6: Media and gallery

**Scope:** image uploads and gallery page.

Tasks:

1. `lib/storage.ts` with a `StorageDriver` interface (`put`, `delete`, `publicUrl`) and drivers: `local` (writes under `public/uploads/`, git-ignored), `vercel-blob`, `r2`. Choose by `STORAGE_DRIVER`.
2. Upload endpoint for admin: accept JPEG, PNG, WebP only; max 8 MB; verify the real file type from bytes, not the extension; strip metadata and resize with `sharp`; generate a WebP version; reject anything else.
3. Public `/gallery`: category filter chips, responsive grid, lightbox with keyboard (arrows, Escape) and swipe support, captions, `next/image` with blur placeholders.
4. Admin gallery reorder (drag and drop or up and down buttons).

Acceptance checks:

- Uploading an `.exe` renamed to `.jpg` is rejected.
- Gallery works with mouse, keyboard and touch; focus is trapped in the lightbox and returns on close.
- Images are served in modern formats with width and height set.
- Lint, typecheck, test, build pass.

Stop and report.

### Phase 7: SEO, accessibility, performance, security, legal

**Scope:** cross-cutting hardening. No new features.

Tasks:

1. `app/sitemap.ts`, `public/robots.txt` (disallow `/admin` and `/api`), canonical URLs, Open Graph and Twitter images.
2. JSON-LD: `Organization` and `LocalBusiness` with the Dubai address, phone and email from settings; `BreadcrumbList` on inner pages; `Service` on service pages.
3. Security headers via `next.config` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection, a content security policy compatible with Turnstile and Plausible). Test that the site still works.
4. Accessibility pass: contrast to WCAG AA, focus order, landmarks, form labels and error announcements, reduced motion, touch targets 44px. Run `@axe-core/playwright` on every public route and fix all serious and critical violations.
5. Performance pass: image sizes, font loading, code splitting, remove unused CSS and JS; target Lighthouse mobile 90+ on inner pages.
6. Cookie and privacy: privacy policy page (draft text, flagged for legal review), cookie notice only if non-essential cookies are used (Plausible is cookie-free).
7. Plausible script loaded only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set; track a custom event `quote_submitted`.
8. Run `npm audit` and fix or document high and critical issues.

Acceptance checks:

- axe reports zero serious or critical issues on all public routes.
- Security headers present (check with `curl -I`).
- Lighthouse scores recorded in `PROGRESS.md`.
- Lint, typecheck, test, build pass.

Stop and report.

### Phase 8: Testing and CI

**Scope:** make regressions hard.

Tasks:

1. Unit tests: validation schemas, rate limiter, storage drivers, content flag filtering, email templates.
2. E2E tests (Playwright, desktop and mobile viewports): navigation, home scroll scenes, quote form success and failure, newsletter, gallery lightbox, admin login, enquiry status change, role restrictions.
3. `.github/workflows/ci.yml`: on push and pull request run install (with cache), lint, typecheck, unit tests, a Postgres service container with migrations, build, and Playwright with report upload.
4. Add a `CONTRIBUTING.md` with the branch and commit rules.

Acceptance checks:

- CI file is valid and the same commands pass locally.
- Coverage summary recorded in `PROGRESS.md` (target: critical paths covered, not a vanity percentage).

Stop and report.

### Phase 9: Deployment and launch

**Scope:** production.

Tasks (the agent prepares everything and gives the human exact steps for actions that need accounts or credentials):

1. Production database on Neon (or Supabase); run `prisma migrate deploy`; run seed once and force the admin to change the password at first login.
2. Deploy the app on Vercel; set every environment variable from Section 5; set `STORAGE_DRIVER` to `vercel-blob` or `r2`.
3. Domain: point `zabshipping.com` and `www` to the host; HTTPS; choose one canonical host and redirect the other.
4. Email deliverability: add the SPF, DKIM and DMARC records for the sending domain (Resend gives the values); send a test enquiry and confirm it is not in spam.
5. Search: submit `sitemap.xml` to Google Search Console; verify redirects from old `.html` URLs.
6. Backups: enable automated database backups; document restore steps.
7. Monitoring: uptime check on `/api/health`; error logging (host logs at minimum).
8. Launch checklist run-through (Section 15).

Acceptance checks:

- Production smoke test passes: home loads, quote form submits, email arrives, admin login works, old URLs redirect.
- All `confirmed: false` items are still hidden unless the human has approved them.

Stop and report. Do not merge or announce launch without human approval.

### Optional Phase 10: Enhancements (only if requested)

Arabic version with RTL layout and `hreflang`; shipment tracking page connected to a real data source; indicative quote calculator for LCL and air; blog; customer accounts. Each gets its own spec before work starts.

---

## 9. Definition of done (every phase)

A phase is done only when all of these are true:

- All acceptance checks listed for the phase pass, with command output pasted into `PROGRESS.md`.
- `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass from a clean install (`rm -rf node_modules .next && npm ci`).
- No `console.log` debugging left, no commented-out code, no TODOs without an entry in `PROGRESS.md`.
- No new accessibility, security or performance regressions.
- Work is committed on the phase branch and the human has been given a short summary and the exact command to run the app.

## 10. Git workflow

```
main                      always deployable
 └─ phase/1-foundation    merged after approval, tagged phase-1-complete
 └─ phase/2-content       ...
```

Before any risky change (migrations, dependency upgrades, large refactors) commit first so it can be reverted with `git revert` or `git reset`. Database migrations are never edited after they are committed; create a new migration instead.

## 11. Troubleshooting rules for the agent

- **Install fails:** read the error, check Node version and network; try `npm cache verify` then reinstall. Do not switch package managers.
- **Docker not running:** tell the human to start Docker Desktop. Do not substitute SQLite silently. If Docker is impossible, ask whether to use a hosted free Neon database for development.
- **Port in use:** pick another port and say so; do not kill unknown processes.
- **Library API differs from this spec:** follow the official documentation and record the change in `PROGRESS.md`.
- **A check fails:** fix the cause. Never disable the check.
- **Missing credentials** (Resend, Turnstile, storage, hosting): continue with the development fallbacks and list exactly what the human must supply.

---

## 12. Content (single source of truth)

All public copy lives in `content/` as typed data. Items marked **[CONFIRM]** are claims taken from the old site that ZAB must verify. Store each with `confirmed: false` in `content/confirm-flags.ts`; render nothing for them (or a neutral fallback) until the human flips the flag. Do not invent replacements.

### 12.0 Company and site-wide data (confirmed)

- Company name: ZAB Shipping LLC
- Address: Office #22, 4th Floor, Baniyas Metro Station, Shake Maryam Building, Opp. Day to Day, Dubai, United Arab Emirates (the old site misspelled "Floor" as "FLLOR"; use the corrected spelling)
- Phone and WhatsApp: +971 569 445 296 (WhatsApp link `https://wa.me/971569445296`)
- Email: admin@zabshipping.com
- Footer tagline: "Freight forwarding and logistics from Dubai to the world."
- Copyright line: "© {current year} ZAB Shipping LLC. All rights reserved."
- Navigation: Home, About, Services (Ocean Freight & Cross Trade, Air Freight, Warehousing & Distribution, Freight Forwarding, Specialised Services), Gallery, Contact, button "Get a Quote".
- Footer link groups: Quick links (Home, About, Gallery, Contact); Services (the five service pages); Contact details; Newsletter box ("Get logistics news and updates").
- Social media links: none known. Render no social icons until the human supplies URLs.

**[CONFIRM] items (hidden until approved):**

| Key                   | Old-site claim                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `stat.shipments`      | "11K+ Delivered Goods" (home) and other conflicting template numbers (25K+, 2.4K+)                                       |
| `stat.countries`      | "125+ Countries" (About, template default)                                                                               |
| `stat.team`           | "over 120 experts" (Ocean Freight page)                                                                                  |
| `stat.years`          | none given                                                                                                               |
| `hubs`                | Australia, Houston, UAE, India, Port Blair, Singapore, Malaysia                                                          |
| `warehouse.locations` | "major Indian ports, airports, ICDs and SEZs"                                                                            |
| `certifications.qms`  | "continuous QMS improvement", no standard named                                                                          |
| `membership`          | "Global recognition for trustworthy and efficient services"; a stray "JCTrans" label suggests JCtrans network membership |
| `response.time`       | none given; needed for the form success message                                                                          |
| `office.hours`        | none given                                                                                                               |

### 12.1 Home page storyboard (nine scenes)

| #   | Scene id      | Background                 | Illustration                                    | Headline                                   | Supporting text                                                                                                           |
| --- | ------------- | -------------------------- | ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | `arrival`     | light                      | Reach stacker lifting a container onto a stack  | Freight, handled.                          | ZAB Shipping moves cargo by sea, air and road from Dubai to the world, with one team accountable from pickup to delivery. |
| 2   | `one-roof`    | dark panel under light sky | Truck crossing the screen                       | Everything freight needs, under one roof.  | Ocean, air, warehousing, customs and specialised cargo, so you deal with one partner instead of five.                     |
| 3   | `ocean`       | deep blue                  | Top-down ship with coloured containers on water | Ocean freight and cross trade              | FCL, LCL and special containers on major global trade lanes, with live visibility from booking to arrival.                |
| 4   | `air`         | dusk gradient              | Plane crossing                                  | Air freight across the UAE, GCC and beyond | Consolidation, direct routings and Sea+Air options when you need to balance speed against cost.                           |
| 5   | `warehousing` | light                      | Warehouse with racks                            | Storage that keeps stock safe and moving   | Closed, open, covered and temperature-controlled space with Just-In-Time support.                                         |
| 6   | `customs`     | dark                       | Document stack with stamp                       | Cleared without the delays                 | Import and export documentation, duties and compliance handled by specialists.                                            |
| 7   | `specialised` | light                      | RORO vessel and hazard diamond                  | Cargo that needs extra care                | Consolidation, RORO, dangerous goods under IATA and IMDG rules, and customs clearance.                                    |
| 8   | `proof`       | dark blue                  | Map with hub pins (hubs only if confirmed)      | Built on a global network                  | Renders confirmed stats only; if none are confirmed, show a text line about the partner network without numbers.          |
| 9   | `cta`         | blue                       | none                                            | Tell us what you're shipping.              | Get a quote or call +971 569 445 296. Button: Get a Quote. Secondary: WhatsApp.                                           |

Hero headline alternates for later A/B testing: "Freight, handled."; "One partner for sea, air and road."; "From Dubai to the world, on schedule."

Below the scenes on the home page: **Why choose ZAB** (six items below) and the **services overview** cards linking to each service page.

**Why choose ZAB**

1. **Compliant by default.** Documentation, customs and dangerous-goods rules are checked before cargo moves, not after it is held.
2. **Quality that is managed.** Documented processes reviewed regularly. (Name a QMS standard only if `certifications.qms` is confirmed.)
3. **On the clock.** Clear milestones and proactive updates so you are never chasing for status.
4. **No surprises.** Itemised quotes and straight answers on cost, route and transit time.
5. **Partners paid on time.** Reliable payments keep carriers, truckers and agents prioritising your cargo.
6. **Part of a trusted network.** (Show only if `membership` is confirmed, with the real name and logo.)

### 12.2 Page content

**About** (`/about`)

- Headline: Logistics built around accountability.
- Intro: ZAB Shipping LLC is a Dubai-based freight forwarder moving cargo by ocean, air and road. We combine a global agent network with a hands-on local team, so every shipment has a named person behind it from booking to final delivery.
- How we work: We plan routes early, sort documentation before cargo moves, and keep you informed at every milestone. When something changes, you hear it from us first, with a solution attached.
- Understanding of global logistics: We understand the complexities of global logistics and the importance of precision in every shipment. By leveraging our network, partnerships and industry knowledge, we make sure goods are transported safely and efficiently, whatever the destination.
- Mission: To give businesses reliable, cost-effective logistics with the highest standards of safety, compliance and service.
- Values: Accountability, Transparency, Safety first, Speed with care.
- Where we operate: only if `hubs` is confirmed.

**Ocean Freight & Cross Trade** (`/services/ocean-freight`)

- Headline: Ocean freight with full visibility.
- ZAB Shipping works with a network of established overseas partners, each a leader in its market, to deliver integrated logistics and supply chain solutions between businesses worldwide.
- Customers get real-time electronic monitoring of cargo movements, inbound or outbound, so they can make informed decisions and optimise operations.
- Before the vessel reaches port, the team coordinates customs, excise, port clearances and other formalities. When the vessel arrives, the customs clearance division moves the cargo to its destination quickly to minimise delay.
- Cross trade explained: shipments arranged between two other countries without the cargo passing through the seller's country.
- Highlights: FCL, LCL and special containers; live cargo tracking; pre-arrival customs coordination; cross-trade between key markets (USA, China, Africa, the Far East, India, Europe).
- Show "120+ experts" only if `stat.team` is confirmed.

**Air Freight** (`/services/air-freight`)

- Headline: Fast lanes from the UAE and GCC to the world.
- Coverage: UAE, GCC, North America, Latin and South America, the Far and Middle East, the Indian Subcontinent, Europe, Australia, New Zealand and South Africa.
- **Air Consolidation:** competitive rates, efficient transit times, multiple airline options and flexible schedules, with tracking from booking to final delivery.
- **Carrier partnerships:** relationships with leading carriers for consistent transit times, ample space, better pricing and priority allocation; cycle times monitored with partners; real-time tracking shared with customers.
- **Export documents:** full-service handling of documentation, customs conformance and air transport from door to door.
- **Sea + Air:** combines ocean affordability with air speed using premium carriers, managed end to end within ZAB's network.
- Sidebar: services list, phone card (+971 569 445 296), compact quote form.

**Warehousing & Distribution** (`/services/warehousing`)

- Headline: Storage that keeps stock safe and moving.
- Closed, open and covered storage, including temperature-controlled space for sensitive goods, with customs-bonded options and Just-In-Time support to reduce carrying costs.
- Key features: Secure and clean storage; advanced security; customs bonding facilities; inventory visibility; connected to the global network.
- Solutions: leased, open and covered warehouses; temperature-controlled storage for sensitive goods (the old text had the typo "emperature-controlled"); Just-In-Time inventory support.
- Locations: only render if `warehouse.locations` is confirmed. The old text named Indian ports, airports, ICDs and SEZs although the company is Dubai-based.
- Closing: our goal is to simplify logistics operations and provide end-to-end warehousing and distribution that meets your requirements.

**Freight Forwarding** (`/services/freight-forwarding`)

- Headline: One forwarder, any mode, any lane.
- Sea, air or land: we plan, document and move cargo end to end.
- Cross-trade expertise connecting the USA, China, Africa, the Far East, India and Europe. Includes freight documentation and embassy legalisation, Bill of Lading compliance, and customs clearance for hazardous and dangerous goods movements.
- Offerings: FCL/LCL/special container freight; RORO and projects; local and cross-trade air freight; import and export customs clearance; door-to-door shipments.
- Commodities (filterable tags with icons): Chemicals, Household Articles, Electronics, Liquor, Machinery, Engineering Goods, Auto Parts, Food Products, Plastics, General Cargo, Vehicle Spare Parts, DG Goods, Heavy Duty Trucks.

**Specialised Services** (`/services/specialised`)

- Headline: For cargo that needs more than a standard box.
- **Consolidation:** combine smaller shipments into one larger consignment for lower freight cost, by air, sea or land. Benefits: cost-effective shipping; efficient handling of smaller shipments; end-to-end tracking.
- **RORO (roll-on/roll-off):** for oversized or wheeled cargo such as vehicles, machinery and heavy equipment. Benefits: safe, secure transport; simplified loading and unloading; oversized cargo expertise.
- **Dangerous goods:** handled to international rules including IATA (air) and IMDG (sea), with correct packaging, documentation and labelling. Benefits: compliance with safety standards; expert handling; secure transport.
- **Customs clearance:** end-to-end handling of documentation, duties and compliance so shipments cross borders smoothly.
- Closing: contact us to learn more about specialised services.

**Gallery** (`/gallery`): items from the database (8 seeded placeholders), each with title, caption, alt text and category (Ocean, Air, Warehouse, Road). The old site had 8 uncaptioned photos; the human will supply the real photos.

**Privacy** (`/privacy`): draft policy covering what the enquiry and newsletter forms collect (name, company, email, phone, shipment details, message), purpose, retention, processors (hosting, database, email, anti-spam, analytics), contact email, and user rights. Mark clearly "Draft: requires legal review".

### 12.3 Quote and contact form

Headline: Tell us what you're shipping.
Sub-text: Send the details and a specialist will come back with a quote. For urgent cargo, call or WhatsApp us.

| Field                        | Type     | Required      | Rules                                                                                                        |
| ---------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| Full name                    | text     | yes           | 2 to 100 characters                                                                                          |
| Company                      | text     | no            | up to 150                                                                                                    |
| Email                        | email    | yes           | valid format                                                                                                 |
| Phone or WhatsApp            | tel      | no            | digits, spaces, plus, hyphen, parentheses                                                                    |
| Service type                 | select   | yes           | Ocean Freight, Air Freight, Warehousing, Customs Clearance, RORO or Project Cargo, Dangerous Goods, Not sure |
| Origin                       | text     | no            | up to 100                                                                                                    |
| Destination                  | text     | no            | up to 100                                                                                                    |
| Cargo type                   | text     | no            | up to 150                                                                                                    |
| Approximate weight or volume | text     | no            | up to 100                                                                                                    |
| Message                      | textarea | yes           | 10 to 2000 characters                                                                                        |
| Consent                      | checkbox | yes           | "I agree to be contacted about this enquiry." with a link to the privacy page                                |
| Hidden honeypot              | text     | must be empty | off-screen, `tabIndex=-1`, `autocomplete=off`                                                                |

Success message: "Thanks, we have your request. We'll reply by email as soon as we can." (Add a time promise only if `response.time` is confirmed.)
Failure message: "Something went wrong. Please try again or call +971 569 445 296."

Team notification email: subject `New enquiry: {serviceType} from {fullName}`, body lists every field and links to the admin enquiry page.
Customer confirmation email: short thank-you restating what they sent and the phone number.

### 12.4 Redirects from the old site (301)

| Old URL                                                                                    | New URL                        |
| ------------------------------------------------------------------------------------------ | ------------------------------ |
| `/index.html`                                                                              | `/`                            |
| `/about.html`                                                                              | `/about`                       |
| `/contact.html`                                                                            | `/contact`                     |
| `/team.html` and `/team.html.html`                                                         | `/gallery`                     |
| `/service-single.html`                                                                     | `/services/ocean-freight`      |
| `/warehousing.html`                                                                        | `/services/warehousing`        |
| `/service-right.html`                                                                      | `/services/air-freight`        |
| `/service-left.html`                                                                       | `/services/specialised`        |
| `/project-single.html` and `/projects.html`                                                | `/services/freight-forwarding` |
| `/service.html`                                                                            | `/`                            |
| `/blog.html`, `/blog-left.html`, `/blog-right.html`, `/blog-single.html`, `/index-03.html` | `/`                            |

### 12.5 SEO titles and descriptions

| Page        | Title                                                       | Meta description                                                                                                        |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Home        | ZAB Shipping LLC \| Freight Forwarding & Logistics in Dubai | Ocean, air, warehousing and customs from Dubai to the world. One accountable team from pickup to delivery. Get a quote. |
| About       | About ZAB Shipping \| Dubai Freight Forwarder               | Meet the Dubai-based team behind ZAB Shipping and our global network of partners.                                       |
| Ocean       | Ocean Freight & Cross Trade \| ZAB Shipping Dubai           | FCL, LCL and special containers with live tracking and pre-arrival customs coordination.                                |
| Air         | Air Freight UAE & GCC \| ZAB Shipping                       | Air consolidation, carrier partnerships and Sea+Air solutions from the UAE to the world.                                |
| Warehousing | Warehousing & Distribution \| ZAB Shipping                  | Closed, open, covered and temperature-controlled storage with Just-In-Time support.                                     |
| Specialised | Specialised Cargo, RORO & Dangerous Goods \| ZAB Shipping   | Consolidation, RORO, IATA and IMDG dangerous goods and customs clearance.                                               |
| Forwarding  | Freight Forwarding & Cross Trade \| ZAB Shipping            | Sea, air and land forwarding with cross-trade expertise across the USA, China, Africa, India and Europe.                |
| Gallery     | Gallery \| ZAB Shipping LLC                                 | Photos of ZAB Shipping cargo, vehicles and warehouse operations.                                                        |
| Contact     | Get a Freight Quote \| ZAB Shipping Dubai                   | Send your shipment details or call +971 569 445 296 for a quote.                                                        |

---

## 13. Design system

Reference style: a cinematic, scroll-driven freight site with alternating light and dark full-screen scenes, large uppercase display type, big curved shape transitions, and a blue "Get Quote" tab fixed to the right edge. Recreate the feel with original illustrations. Do not copy any third-party artwork or code.

**Tokens** (adjust to the real logo colours when the human supplies it; keep names stable):

```css
:root {
  --navy-950: #040b1c;
  --navy-900: #071735;
  --blue-700: #0b3fae;
  --blue-500: #1f6bff; /* primary accent and CTA */
  --blue-300: #7fb0ff;
  --sky-100: #eaf2ff;
  --ink-900: #0b0f19; /* text on light */
  --ink-600: #475069;
  --paper: #f6f7fa; /* light scene background */
  --white: #ffffff;
  --success: #12805c;
  --danger: #c0262d;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 28px;
  --shadow-md: 0 10px 30px rgba(7, 23, 53, 0.18);
  --container: 1200px;
}
```

**Typography:** display face bold or black weight, uppercase for scene headlines (for example Archivo, Barlow Condensed or Oswald via `next/font`); text face a readable sans-serif (for example Inter or DM Sans). Fluid sizes with `clamp()`. Body text at least 16px, line height 1.6.

**Motion rules:** durations 300 to 700 ms for UI, scroll-linked for scenes; ease `power2.out`; nothing flashes more than 3 times per second; all motion disabled under `prefers-reduced-motion`.

**Components to build:** Header with mega menu, Footer, FloatingCTA, WhatsAppButton, PageBanner, ServiceCard, FeatureList, StatStrip, CommodityTags, GalleryGrid, Lightbox, QuoteForm, NewsletterForm, CTASection, admin DataTable, admin forms.

**Accessibility minimums:** contrast AA (4.5:1 text, 3:1 large text and UI), visible focus ring on every interactive element, touch targets at least 44px, labels on all inputs, errors linked with `aria-describedby`, lightbox focus trap, skip link, `lang="en"`.

---

## 14. Kickoff prompt (paste this into the agent)

```
You are building the ZAB Shipping LLC website. The full specification is in
AGENTS.md (also docs/BUILD_SPEC.md) in this folder. Read it completely before
doing anything.

Rules:
- Follow the phases in Section 8 in order, one at a time.
- Start with Phase 0 only. When it is finished, stop and report.
- Do not start the next phase until I reply "approved, next phase".
- Install every dependency yourself with npm, npx and docker compose. Use the
  current stable versions and let package-lock.json pin them.
- Work on a branch named phase/N-name and commit in small steps.
- Run the acceptance checks for the phase and show me the real command output.
- Never invent business facts. Anything marked [CONFIRM] stays hidden until I
  approve it.
- If you are blocked or something in the spec conflicts with the official docs
  of a library, stop and ask me, or record the difference in PROGRESS.md.

Begin Phase 0 now.
```

To continue after each phase, reply: `approved, next phase`.
To fix something, reply with the problem; the agent must fix it on the same phase branch before moving on.

---

## 15. Launch checklist

- [ ] All **[CONFIRM]** items resolved or intentionally left hidden
- [ ] Real logo, favicon and Open Graph image in place
- [ ] Real photos uploaded (or illustrations approved)
- [ ] Admin password changed from the seed value; second admin created
- [ ] Production environment variables set; no secrets in git history
- [ ] Test enquiry received by email (not in spam) and visible in admin
- [ ] SPF, DKIM and DMARC records published
- [ ] Old `.html` URLs redirect correctly
- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] axe and Lighthouse results recorded in `PROGRESS.md`
- [ ] Privacy policy reviewed by someone qualified
- [ ] Database backups enabled and a restore tested
- [ ] Uptime monitoring on `/api/health`
- [ ] Human has approved launch in writing

---

## 16. Reference: facts about the old site (for the agent's context only)

- The old site was a static HTML template ("Cargon" theme) customised by 4Biz International, using Bootstrap, jQuery 3.7.1, Slick, AOS, Magnific Popup, CounterUp, Waypoints and Nice Select, with no backend, database or analytics.
- Its forms used `action="#"` and submitted nowhere. Its About page still showed template contact details (a Melbourne address, `infocargon@gmail.com`) and template statistics; ignore those.
- Its nine live pages were `index`, `about`, `contact`, `team` (Gallery), `warehousing`, `service-single` (Ocean), `service-right` (Air), `service-left` (Specialised) and `project-single` (Freight Forwarding). Unused template pages (blog, duplicate home) are not carried over.
- Its images are not available to the agent. Use generated placeholders until the human places real photos in `public/images/user/` and uploads them through the admin gallery.
