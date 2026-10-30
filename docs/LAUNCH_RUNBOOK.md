# Production launch runbook

This runbook prepares the first production release. The application is not
launched: production account access, credentials, DNS changes, and human
approvals are still required.

## 1. Create production services

1. Choose Neon or Supabase and create a production PostgreSQL database. Store
   its provider-issued connection string securely; do not put it in this file,
   source control, or shell history.
2. Create the Vercel project from the approved repository and production
   branch. Set the project root to the repository root and use the repository's
   existing build command.
3. Choose exactly one canonical host (`zabshipping.com` or `www.zabshipping.com`)
   and add both hostnames to the Vercel project. Apply the provider-recommended
   DNS records for the selected project and configure the other hostname to
   redirect to the canonical host. Wait for HTTPS certificates to become
   active before testing forms.
4. Choose durable media storage:
   - Vercel Blob: set `STORAGE_DRIVER=vercel-blob` and `BLOB_READ_WRITE_TOKEN`.
   - Cloudflare R2: set `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`,
     `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and
     `R2_PUBLIC_URL`. Configure the public bucket/custom domain so uploaded
     objects are served from that base URL.

Production must not use local disk storage because serverless filesystems are
ephemeral.

## 2. Configure environment variables

Set these in the hosting provider's production environment. Use the same
canonical HTTPS origin for the public and authentication URLs.

| Variable                         | Production value                                                          |
| -------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Canonical HTTPS site URL                                                  |
| `NEXTAUTH_URL`                   | Canonical HTTPS site URL                                                  |
| `AUTH_URL`                       | Canonical HTTPS site URL                                                  |
| `AUTH_SECRET`                    | New, unique secret generated with `openssl rand -base64 32`               |
| `DATABASE_URL`                   | Production PostgreSQL connection string from the chosen provider          |
| `SEED_ADMIN_EMAIL`               | Named administrator account; used only when seeding                       |
| `SEED_ADMIN_PASSWORD`            | Unique temporary password, at least 12 characters; used only when seeding |
| `RESEND_API_KEY`                 | Production Resend API key                                                 |
| `EMAIL_FROM`                     | Verified sender identity on the configured domain                         |
| `ENQUIRY_NOTIFY_TO`              | Mailbox that should receive quote enquiries                               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production Cloudflare Turnstile site key                                  |
| `TURNSTILE_SECRET_KEY`           | Matching Turnstile secret key                                             |
| `STORAGE_DRIVER`                 | `vercel-blob` or `r2`; never leave this implicit in production            |
| `BLOB_READ_WRITE_TOKEN`          | Required only when using Vercel Blob                                      |
| `R2_ACCOUNT_ID`                  | Required only when using R2                                               |
| `R2_ACCESS_KEY_ID`               | Required only when using R2                                               |
| `R2_SECRET_ACCESS_KEY`           | Required only when using R2                                               |
| `R2_BUCKET`                      | Required only when using R2                                               |
| `R2_PUBLIC_URL`                  | Required only when using R2                                               |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`   | Optional; set only if cookie-free Plausible analytics is enabled          |

`NODE_ENV` is set by the production runtime; do not override it in Vercel. Keep
secrets out of `NEXT_PUBLIC_*` variables, client bundles, logs, and committed
files. Never use the example seed password.

## 3. Migrate and seed the production database

Use a secured operator environment with the production variables loaded. Run
the committed migrations before deploying code that depends on them:

```sh
npx prisma migrate deploy
```

Run the seed once for a fresh database:

```sh
npm run db:seed
```

The seed creates the initial administrator with a mandatory password-change
step at first sign-in. Protect the temporary password, sign in once over HTTPS,
and set a unique replacement password before using the admin panel. Do not
rerun the seed to change passwords: existing records are intentionally
preserved.

## 4. Email and spam-protection setup

1. Add the sending domain in Resend and publish the exact SPF, DKIM, and DMARC
   records shown by Resend at the authoritative DNS provider. Do not copy
   placeholder records from this runbook. Wait for verification to complete.
2. Configure Turnstile for the production hostname and use the matching
   production site/secret key pair.
3. Submit one real quote enquiry over HTTPS. Confirm the enquiry is visible in
   the admin panel and the team notification and customer confirmation arrive
   (including inbox/spam-folder checks).
4. Submit a newsletter form and verify that the subscription is stored. The
   application records the subscription; it does not send newsletter campaigns.

## 5. Search, backups, and monitoring

1. Open `https://<canonical-host>/robots.txt` and
   `https://<canonical-host>/sitemap.xml`. Submit the sitemap in Google Search
   Console and verify all legacy `.html` redirects.
2. Enable the database provider's automated backups/PITR plan. Before launch,
   restore a backup to a separate non-production database, run
   `npx prisma migrate deploy` if required, point a non-production app at that
   restored database, and verify `/api/health` and representative records.
   Never test a restore by overwriting the live database.
3. Configure an external uptime check for `https://<canonical-host>/api/health`
   and alert on non-2xx responses. Review Vercel runtime/build logs at minimum;
   add a dedicated error-monitoring provider only after its credentials and
   privacy configuration are approved.

## 6. Human launch checklist

- [ ] Resolve each `[CONFIRM]` item with the company or intentionally keep it hidden.
- [ ] Approve the logo, favicon, generated Open Graph image, and real gallery photos (or approve the illustrations).
- [ ] Change the temporary administrator password at first sign-in and create a second administrator.
- [ ] Confirm all production variables are set and no secret is in git history.
- [ ] Verify the quote enquiry, both email messages, and admin visibility.
- [ ] Verify SPF, DKIM, and DMARC.
- [ ] Verify old `.html` redirects, canonical-host redirect, and HTTPS.
- [ ] Submit the sitemap to Google Search Console.
- [ ] Review the privacy policy with a qualified reviewer.
- [ ] Record axe and Lighthouse results in `PROGRESS.md`; the current mobile Lighthouse performance targets are not yet met.
- [ ] Enable automated backups, complete a non-production restore test, and monitor `/api/health`.
- [ ] Obtain written human approval before announcing or merging the launch.

## Current blockers

No hosting, database, DNS, Resend, Turnstile, or storage production credentials
are available in this workspace. The real email and production-authentication
smoke tests, account configuration, DNS publication, Search Console submission,
backup/restore, and final human approval must be completed by an authorized
operator. Lighthouse performance targets and qualified privacy review are
also outstanding. Do not claim the service is launched until these checks
pass.
