#!/bin/sh
set -e

echo "Applying pending migrations..."
npx prisma migrate deploy

echo "Starting dev server..."
exec npm run dev
