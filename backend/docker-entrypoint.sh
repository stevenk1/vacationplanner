#!/bin/sh
set -e

PB_DATA=/pb/pb_data
PB_FLAGS="--dir=$PB_DATA --migrationsDir=/pb/pb_migrations --hooksDir=/pb/pb_hooks"

# Apply migrations + ensure the dashboard admin exists (idempotent).
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  echo "→ Ensuring PocketBase superuser: $PB_ADMIN_EMAIL"
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" $PB_FLAGS || true
fi

echo "→ Starting PocketBase on :8090"
exec /pb/pocketbase serve --http=0.0.0.0:8090 $PB_FLAGS
