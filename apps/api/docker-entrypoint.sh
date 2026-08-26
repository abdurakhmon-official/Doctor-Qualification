#!/bin/sh
set -e

echo "[entrypoint] applying pending Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] starting server..."
exec "$@"
