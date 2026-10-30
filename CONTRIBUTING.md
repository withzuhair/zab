# Contributing

## Branches

- Keep `main` deployable; do phase work on `phase/<number>-<short-name>` branches.
- Use `fix/<short-name>` for focused fixes and `docs/<short-name>` for documentation-only work.
- Merge phase branches only after the human has reviewed and approved the phase. Create a `phase-<number>-complete` tag only after that approval.
- Do not force-push shared branches. Never commit `.env.local`, credentials, generated uploads, or other secrets.

## Commits

- Make small, focused commits with imperative summaries that describe the change.
- Use a conventional prefix when helpful, such as `feat:`, `fix:`, `test:`, or `docs:`.
- Before risky changes such as migrations, dependency upgrades, or large refactors, commit the current working state so it can be reverted safely.
- Once a migration is committed, do not edit it; add a new migration for follow-up changes.
- Keep commits passing the Husky pre-commit hook (`lint-staged`).

## Local checks

Run the relevant checks before committing:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

For browser and database changes, also run the Playwright suite with PostgreSQL
available:

```sh
npm run test:e2e
```

Use `npx prisma migrate dev --name <description>` for local schema changes and
`npx prisma migrate deploy` to apply committed migrations to a deployment.
