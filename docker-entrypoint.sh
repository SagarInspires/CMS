#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${CRON_SECRET:?CRON_SECRET is required}"

echo "Running production database migrations..."
prisma migrate deploy

echo "Starting Next.js standalone application..."
exec node server.js
