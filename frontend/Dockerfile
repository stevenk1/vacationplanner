# ── Stage 1: build the SPA ────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: serve with Caddy (static + reverse proxy to PocketBase) ───────
FROM caddy:2-alpine
RUN apk add --no-cache gettext
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY config.template.js /etc/config.template.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
