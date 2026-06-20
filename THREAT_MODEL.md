# EditorialFlow Threat Model

## Assumptions
- PostgreSQL is isolated and not exposed to the public internet directly.
- The Next.js application runs over HTTPS in production.

## Identified Threats & Mitigations

1. **Cross-Site Scripting (XSS)**
   - *Threat:* Malicious authors inject JavaScript into article content.
   - *Mitigation:* All rich-text content is sanitized server-side using `isomorphic-dompurify` before storage and rendering. `dangerouslySetInnerHTML` is only used on sanitized output.

2. **Cross-Site Request Forgery (CSRF)**
   - *Threat:* Attackers force authenticated users to perform actions.
   - *Mitigation:* Next.js Server Actions automatically protect against CSRF using built-in origin checks and tokens.

3. **Broken Access Control & Privilege Escalation**
   - *Threat:* Authors modifying other people's articles or accessing Admin endpoints.
   - *Mitigation:* A centralized RBAC system (`src/lib/auth/rbac.ts`) validates roles at the middleware level AND inside every server action/API route.

4. **JWT Theft & Session Fixation**
   - *Threat:* Attackers steal access tokens.
   - *Mitigation:* JWTs are stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies, preventing JavaScript access and cross-site leakage.

5. **Malicious File Uploads**
   - *Threat:* Uploading reverse shells or massive files.
   - *Mitigation:* The `/api/upload` route strictly validates `image/*` MIME types and enforces a 5MB size limit. Safe filenames are generated to prevent path traversal.
