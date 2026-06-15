#!/bin/sh
set -e

# Inject the Mapbox token into the static config.js at runtime (no rebuild needed).
: "${MAPBOX_TOKEN:=}"
export MAPBOX_TOKEN
envsubst '${MAPBOX_TOKEN}' < /etc/config.template.js > /srv/config.js

if [ -n "$MAPBOX_TOKEN" ]; then
  echo "→ config.js written (Mapbox token set)"
else
  echo "⚠  MAPBOX_TOKEN is empty — the map & location search will not work. Set it in .env."
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
