#!/bin/sh
set -e

echo "[entrypoint] applying pending Prisma migrations..."
npx prisma migrate deploy

# seed.ts is idempotent (specialties only into an empty table, admin via upsert), so running it on every start is safe
if [ -n "$SEED_ADMIN_EMAIL" ]; then
  echo "[entrypoint] seeding admin and specialties..."
  npx prisma db seed
fi

echo "[entrypoint] starting server..."
exec "$@"
