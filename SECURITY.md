# Security Overview

EditorialFlow implements a defense-in-depth security strategy designed to protect editorial integrity and user data.

## Authentication & Authorization
- **Passwords:** Hashed using Argon2id with dynamically generated salts.
- **Sessions:** Stateless JWTs signed with a strong `JWT_SECRET`. Stored exclusively in HttpOnly, Secure, SameSite=Strict cookies to mitigate XSS and CSRF.
- **RBAC:** Strict Server-Side validation on every route and Server Action. UI hiding is only a visual aid; the backend verifies the user's role and ownership of the resource before any mutation.

## Content Security
- **Isomorphic HTML Sanitization:** Rich text from the TipTap editor is sanitized on the server using `DOMPurify` backed by `JSDOM`. Malicious payloads (e.g., `<script>`, `javascript:`) are aggressively stripped before reaching the database or the client.
- **Output Encoding:** React automatically escapes string bindings.
- **File Uploads:** Uploaded images are strictly validated against allowed MIME types and magic bytes. Extensions are sanitized and names are randomized to prevent path traversal and arbitrary code execution.

## Dependency Management
- Lockfiles (`pnpm-lock.yaml`) ensure deterministic builds.
- Critical libraries (Argon2, Prisma, DOMPurify) are pinned and regularly audited.
