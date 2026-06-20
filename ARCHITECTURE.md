# EditorialFlow Architecture

## High-Level Architecture
EditorialFlow is built as a monolithic Next.js application using the App Router. It serves both the backend API/Server Actions and the frontend React Server Components from the same Node.js process.

### Core Components
1. **Frontend Layer:** React Server Components + Client Components styled with Tailwind CSS.
2. **Backend Logic:** Next.js Server Actions for mutations, API routes for external/webhook access.
3. **Data Access Layer:** Prisma ORM.
4. **Database:** PostgreSQL for relational data and JSON document storage (for TipTap rich text).
5. **State Management:** URL search parameters for filtering, React state for local UI state. No global state manager (e.g., Redux) is used, relying entirely on React's concurrent rendering and server data fetching.

## Database Schema Model
- **User:** Represents authors, editors, and admins. Contains Argon2id hashed passwords and role definitions.
- **Article:** The core entity. Contains rich text content (JSON), sanitized HTML, publishing status, and relations to authors, categories, and tags.
- **Category:** A taxonomy for grouping articles.
- **Tag:** Flexible tagging system.
- **AuditLog:** An immutable ledger of state transitions and user actions.

## Deployment Architecture
- Designed for **Docker Standalone**.
- Uses Next.js `output: 'standalone'` to create a minimal container.
- Depends on PostgreSQL.
- Currently relies on local file system for uploads (limits horizontal scaling).
