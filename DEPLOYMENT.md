# EditorialFlow Production Deployment Guide

This guide outlines the procedure for deploying EditorialFlow using the bundled Docker Compose setup, including security considerations, reverse proxy requirements, and environment configuration.

## Prerequisites

- Docker and Docker Compose installed on the host machine.
- A secure reverse proxy (like Nginx, Caddy, or Traefik) terminating TLS/HTTPS.
- A long-lived, cryptographically secure `JWT_SECRET` and `CRON_SECRET`.

## Security Architecture

1. **Non-Root Runtime:** The Next.js application runs as a restricted `nextjs` user inside the container.
2. **Standalone Build:** Only the compiled code and strictly required dependencies are included in the final image, drastically reducing the attack surface.
3. **Database Isolation:** PostgreSQL is not bound to the host ports. It is only accessible to the internal Docker network.
4. **Strict Authentication:** The application will fatally exit if booted in production without a valid `JWT_SECRET`.
5. **Secure Cookies:** `NODE_ENV=production` automatically enforces `Secure` and `HttpOnly` flags on session cookies.

## Deployment Steps

### 1. Environment Configuration

Copy the example environment file and fill in the required secure secrets:

```bash
cp .env.production.example .env
# Edit .env and set DB_PASSWORD, JWT_SECRET, and CRON_SECRET
nano .env
```

### 2. Build the Production Image

The multi-stage build securely compiles Next.js:

```bash
docker compose -f docker-compose.production.yml build
```

### 3. Start the Application

Bring up the database and the web server in detached mode:

```bash
docker compose -f docker-compose.production.yml up -d
```

*Note: The Next.js container automatically executes `npx prisma migrate deploy` upon startup. It will safely apply any missing schema migrations before spinning up the Node server. Database seeding is completely disabled in production.*

### 4. Health Verification

Verify that both the database and the web server are healthy:

```bash
docker ps
```
You can also manually check the application health endpoint:
```bash
curl -f http://localhost:3000/api/health
```

## Reverse Proxy Requirements (HTTPS)

You **must** run EditorialFlow behind a reverse proxy that terminates TLS/HTTPS. 

### Nginx Example
```nginx
server {
    listen 443 ssl;
    server_name editorialflow.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example
```Caddyfile
editorialflow.example.com {
    reverse_proxy localhost:3000
}
```

## Volumes & Backups

- **PostgreSQL Data:** Stored in the `postgres_data` Docker volume. Ensure you implement regular logical backups (e.g., via `pg_dump`).
- **User Uploads:** Stored in the `uploads_data` volume and mapped to `/app/public/uploads` inside the container. This directory is strictly isolated from application code and restricted by Next.js middleware routing rules.

## Rollback Procedures

If a deployment fails:
1. Revert to the previous image tag or Git commit.
2. If database schema changes were made, you may need to restore from a `pg_dump` backup, as Prisma `down` migrations are not automatically handled in the production deploy script.
