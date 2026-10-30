# ZAB Shipping

Build instructions and scope are documented in [`ZAB_SHIPPING_BUILD_SPEC.md`](./ZAB_SHIPPING_BUILD_SPEC.md).
Production account setup, deployment, and launch checks are documented in
[`docs/LAUNCH_RUNBOOK.md`](./docs/LAUNCH_RUNBOOK.md).

## Local setup

1. Install Node.js on the current LTS release line, npm, Git, and Docker Desktop with Docker Compose.
2. Copy `.env.example` to `.env.local`, set a unique `AUTH_SECRET`, and set
   `NEXTAUTH_URL` to the app origin before using authenticated features.
3. Start the local database:

   ```sh
   docker compose up -d
   docker compose ps
   ```

   Wait for the `postgres` service to report `healthy`. To run the optional email-testing service, use `docker compose --profile email up -d`.

4. Install dependencies with `npm install`, apply the database migration and seed
   the local database:

   ```sh
   npm run db:migrate -- --name init
   npm run db:seed
   ```

   Set a unique `SEED_ADMIN_PASSWORD` in `.env.local` before seeding. The development
   email sender logs messages to the server console when `RESEND_API_KEY` is empty;
   Turnstile is skipped with a warning while running in development without keys.

5. Start the app with `npm run dev`. Sign in to the admin panel at
   `/admin/login` with the seeded `SEED_ADMIN_EMAIL` and
   `SEED_ADMIN_PASSWORD`. The seed stores only a bcrypt password hash.

Do not commit `.env.local` or put real credentials in `.env.example`.

### Gallery media storage

The admin gallery accepts JPEG, PNG, and WebP files up to 8 MB. Uploads are
verified from their file bytes, metadata is removed, and the saved image is
resized and converted to WebP. New uploads remain unpublished until reviewed.

Set `STORAGE_DRIVER` to `local`, `vercel-blob`, or `r2`. Local development uses
`local`, which stores ignored files under `public/uploads/`. For Vercel Blob,
set `BLOB_READ_WRITE_TOKEN`. For Cloudflare R2, set `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_URL`.
The R2 public URL must serve objects from the configured bucket. Production
deployments must set `STORAGE_DRIVER` explicitly; ephemeral local storage is
not suitable for serverless deployments.

# zab
