#!/bin/sh
# Restore the database from a nightly dump. Replaces ALL current data.
#   sh deploy/restore.sh backups/db-2026-10-20-0300.sql.gz
set -e

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
FILE="$1"

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: sh deploy/restore.sh backups/<file>.sql.gz" >&2
  ls -1 backups 2>/dev/null | tail -n 5
  exit 1
fi

printf "This replaces the whole database with %s. Type RESTORE to continue: " "$FILE"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

# stop the API so nothing writes while the schema is recreated (fine if it is already down)
$COMPOSE stop api 2>/dev/null || true

$COMPOSE exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gunzip -c "$FILE" | $COMPOSE exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q'

$COMPOSE start api
echo "Restored from $FILE."
