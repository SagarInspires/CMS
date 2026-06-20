# Release Checklist

Before releasing a new version of EditorialFlow to production, ensure the following steps are completed.

## 1. Environment Validation
- [ ] Ensure `.env.production` is correctly synchronized across all instances.
- [ ] Verify `POSTGRES_USER`, `POSTGRES_DB`, and `POSTGRES_PASSWORD` match exactly with `DATABASE_URL`.
- [ ] Confirm no `.env` files or secrets are committed to the repository.

## 2. Secret Rotation
- [ ] If any secrets (`JWT_SECRET`, `CRON_SECRET`) were potentially exposed, regenerate them using secure random strings (e.g., `openssl rand -base64 32`).

## 3. Database Backup
- [ ] Execute a full `pg_dump` of the `editorialflow_prod` database before applying any migrations.

## 4. Migration Review
- [ ] Review pending Prisma migrations (`npx prisma migrate status`).
- [ ] Ensure all migration scripts are safe for production and do not contain destructive down-migrations that drop tables unnecessarily.

## 5. Quality Gates
- [ ] Run typechecking: `pnpm tsc --noEmit`
- [ ] Run linter: `pnpm lint`
- [ ] Run unit tests: `pnpm test`
- [ ] Run E2E tests: `pnpm test:e2e`

## 6. Docker Image Build
- [ ] Build the production image cleanly without using cache if dependencies changed: `docker compose -f docker-compose.production.yml build --no-cache`
- [ ] Verify the image size is reasonable (standalone build).

## 7. Deployment & Health Check
- [ ] Deploy containers: `docker compose --env-file .env.production -f docker-compose.production.yml up -d`
- [ ] Verify both `db` and `web` containers reach `(healthy)` status.
- [ ] Confirm the application is running as a non-root user (`nextjs`).
- [ ] Confirm persistent volumes (`postgres_data`, `uploads_data`) are mounted correctly.

## 8. Rollback Procedure
- [ ] If health checks fail, immediately revert to the previous Docker image tag.
- [ ] If database migrations caused the failure, restore from the `pg_dump` backup.

## 9. Post-Deployment Smoke Tests
- [ ] Verify login functionality for an admin user.
- [ ] Create a draft article, upload an image, and save.
- [ ] Manually hit `/api/health` and check response.

## 10. Monitoring Checks
- [ ] Monitor container logs for `Error:` or `P1000` patterns during the first 10 minutes.
- [ ] Check system resource usage (Memory/CPU) to ensure no severe leaks.
