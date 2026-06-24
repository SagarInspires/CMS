# Security Configuration

## Authentication
- **Password**: Hashed using Argon2id.
- **Google Sign-In**: Uses Google Identity Services. Server verifies cryptographic signature of the ID Token. CSRF is mitigated via Double-Submit cookie validation.
- **Sessions**: JWTs stored in HttpOnly, Secure, SameSite=Lax cookies.

## Google Cloud Configuration
Manual Google Cloud Configuration instructions:
1. Create/select a Google Cloud project.
2. Configure OAuth consent screen.
3. Choose External user type for public users.
4. Add only `openid`, `email`, `profile` scopes.
5. Create Web application OAuth Client ID.
6. Add authorized local origin: `http://localhost:3000`
7. Add exact staging HTTPS origin later.
8. Configure exact callback/login URI used by the application (`/api/auth/google`).
9. Add test users while consent screen remains in testing mode.
10. Configure branding/homepage/privacy-policy URLs for production.
