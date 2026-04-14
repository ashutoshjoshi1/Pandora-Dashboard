#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma db push --skip-generate

echo "Seeding database (idempotent - clears and re-seeds)..."
npx tsx prisma/seed/seed.ts

echo "Starting application..."
exec "$@"
