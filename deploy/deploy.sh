#!/bin/sh
# Pull the latest master and rebuild/restart everything. Run from the repo root on the server:
#   sh deploy/deploy.sh
set -e

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "No .env here - copy deploy/env.production.sample to .env and fill it in first." >&2
  exit 1
fi

# refuse to start with sample values still in place
if grep -Eq '^(POSTGRES_PASSWORD|JWT_SECRET|SEED_ADMIN_PASSWORD)=change_me$' .env; then
  echo "Replace every change_me value in .env before deploying." >&2
  exit 1
fi

mkdir -p backups

echo "[deploy] pulling latest code..."
git pull --ff-only

echo "[deploy] building and starting containers..."
$COMPOSE up -d --build

echo "[deploy] removing old images..."
docker image prune -f >/dev/null

echo "[deploy] status:"
$COMPOSE ps
