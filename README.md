# EditorialFlow CMS

A production-grade, API-first editorial Content Management System built with Next.js 16.2.9, React 19, TypeScript, Tailwind, and Prisma.

## Project Overview
EditorialFlow is a robust, security-first CMS designed specifically for rigorous editorial teams. It enforces a strict state-machine workflow to ensure content is properly reviewed before publication, and provides a full management dashboard as well as a public-facing portal.

## Technology Stack
- **Framework:** Next.js 16.2.9 (App Router, React Server Components)
- **UI:** React 19
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL 15
- **Styling:** Tailwind CSS
- **Authentication:** Custom JWT-based rotating sessions with Argon2id hashing
- **Testing:** Playwright (E2E), Vitest (Unit)
- **Containerization:** Docker & Docker Compose (Standalone mode)

## Main Features
- **Fine-grained RBAC:** Strict access controls across all API endpoints and server actions.
- **Editorial Workflow Engine:** State-machine enforced transitions.
- **Security:** CSRF protection, HttpOnly cookies, isomorphic HTML sanitization (DOMPurify/JSDOM).
- **Rich Text Editing:** TipTap JSON and HTML storage.
- **Audit Logging:** Comprehensive tracking of all editorial actions.

## Role and Permission Summary
- **Author:** Can create drafts, submit for review, and edit their own drafts/rejected articles. Cannot publish or review.
- **Editor:** Can review submitted articles, approve, reject, or schedule them. Can edit any article. Cannot manage users.
- **Admin:** Can manage user roles, delete articles, and oversee the entire system.

## Editorial Workflow
1. **Draft:** Initial state. Author writes content.
2. **In Review:** Author submits. Content is locked from author edits.
3. **Approved:** Editor approves the content.
4. **Scheduled:** Editor schedules publication for a future date.
5. **Published:** Article goes live (handled by cron or manual action).
6. **Rejected:** Editor rejects with notes; returns to Author for revision.

## Environment Setup
Copy `.env.example` to `.env` for local development. For production, copy `.env.production.example` to `.env.production` and fill in secure random values. **Never commit `.env` or `.env.production` to version control.**

## Local Setup
1. **Clone and Install:**
   ```bash
   pnpm install
   ```

2. **Start Development Database:**
   ```bash
   pnpm db:dev:up
   ```

## Database Migration
Apply the schema to your database:
```bash
pnpm db:migrate
```

## Seed Instructions (Development Only)
**Warning: Never run the seed script in a production environment.** It creates default accounts with known passwords.
```bash
pnpm db:seed
```
*Development Accounts:*
- `admin@editorialflow.local` / `Password123!`
- `editor@editorialflow.local` / `Password123!`
- `author1@editorialflow.local` / `Password123!`

## Test Commands
```bash
# Run unit tests
pnpm test

# Run full Playwright E2E suite
pnpm test:e2e
```

## Docker Production Setup
EditorialFlow is built to run as an optimized Next.js standalone container.
1. Configure `.env.production` with secure credentials.
2. Build and start:
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```
The container handles database migrations automatically on startup and runs as a non-root user.

## Deployment Limitations
- **Single Instance:** The current session and cron implementations are designed for a single-node deployment. Multi-node setups require external session stores (e.g., Redis).
- **Local Storage:** Uploaded files are currently stored on the local filesystem. Production environments requiring horizontal scaling must implement an S3-compatible storage adapter.

## License
MIT License. See `LICENSE` for more information.
