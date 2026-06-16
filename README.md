# 🌍 Holiday Idea Planner

A beautiful, personal app to plan trip ideas visually. Create a **holiday** with a date range
and a country-derived **theme** (flag, flag-color stripes, landmark emoji, accent). Break it into
**sub-periods**, each with its own **stay** (accommodation), and pin the **places you want to
visit**. Everything shows up on an interactive **map**, and a **"drive from stay"** panel lists the
driving time + distance from each place to its sub-period's stay.

Runs entirely with **Docker** — `docker compose up` and open your browser.

---

## ✨ Features

- **Country-themed holidays** — flag, flag-color stripe band, landmark emoji and an accent color
  derived automatically from the destination (with an optional custom accent).
- **Sub-periods with their own stay** — handy for road trips where you change accommodation.
- **Places to visit** — search attractions, towns and addresses (Mapbox POI search), categorized
  with emoji.
- **Interactive map** — stays and places color-coded per sub-period, with popups and a legend.
- **Driving times** — distance + drive time from each place to its sub-period's stay, computed via
  the Mapbox Directions API and cached on each place (with a one-click recompute).
- **Responsive** — the detail view stacks map-above, drive-list-below on narrow screens.

## 🧱 Stack

| Layer | Tech |
|------|------|
| Frontend | React + TypeScript + Vite, Tailwind CSS, TanStack Query, react-map-gl (Mapbox GL) |
| Backend / DB | [PocketBase](https://pocketbase.io) (single binary, SQLite, REST API + admin UI) |
| Web server | Caddy — serves the SPA and reverse-proxies `/api` + `/_/` to PocketBase |
| Maps & routing | Mapbox Search Box, Geocoding & Directions APIs |

---

## 🚀 Quick start

**Prerequisites:** Docker (with Compose) and a free **Mapbox public token**
(create one at <https://account.mapbox.com/access-tokens/>).

```bash
# 1. configure
cp .env.example .env
#    edit .env and set MAPBOX_TOKEN=pk.... (and optionally the admin email/password)

# 2. run
docker compose up --build

# 3. open
#    App:              http://localhost:31415
#    PocketBase admin: http://localhost:8090/_/   (log in with PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD)
```

That's it. The schema is created automatically on first start, and your data lives in the
`pb_data` Docker volume (so it survives `docker compose down` / `up`).

### Environment (`.env`)

| Variable | Purpose |
|----------|---------|
| `MAPBOX_TOKEN` | Public Mapbox token — required for the map, search and driving times. Injected into the SPA at runtime (no rebuild needed when you change it; just restart the `web` container). |
| `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` | Login for the PocketBase admin dashboard. |
| `WEB_PORT` / `PB_PORT` | Host ports (default `31415` / `8090`). |

---

## 🧰 Run with .NET Aspire (local dev orchestration)

A **.NET Aspire AppHost** ([`apphost.mts`](apphost.mts)) is included as an alternative to the manual
two-terminal flow. It boots the PocketBase backend (built from `backend/Dockerfile`) and the Vite dev
server together behind the **Aspire dashboard** — one command, unified logs/traces, and automatic
startup ordering. Aspire assigns ports dynamically and injects the PocketBase URL into the frontend,
so nothing is hard-coded. `docker compose` remains the production path; this is for development.

**Prerequisites:** Docker running, the [Aspire CLI](https://aspire.dev) and the .NET 10 SDK
(`aspire doctor` checks everything).

```bash
# 1. configure (same .env as Docker Compose)
cp .env.example .env        # set MAPBOX_TOKEN, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD

# 2. one-time: regenerate the AppHost's TypeScript SDK bindings
aspire restore

# 3. provide the AppHost parameters from .env, then run
set -a; . ./.env; set +a
export Parameters__mapbox_token="$MAPBOX_TOKEN" \
       Parameters__pb_admin_email="$PB_ADMIN_EMAIL" \
       Parameters__pb_admin_password="$PB_ADMIN_PASSWORD"
aspire run
```

The dashboard opens automatically. From it, open the **frontend** endpoint for the app and the
**pocketbase** endpoint's `/_/` for the admin UI. The frontend's npm dependencies are installed
automatically on first start.

> Parameters are declared in the AppHost and shown as resources in the dashboard; their values come
> from the `Parameters__*` environment variables above (you can also use
> [user secrets](https://aka.ms/aspire/user-secrets) or let the dashboard prompt on first run).
> The manual two-terminal flow below still works unchanged.

---

## 🗺️ How it works

```
browser ──▶ web (Caddy :31415) ──┬─ /            → React SPA (+ /config.js with the Mapbox token)
                                  └─ /api, /_/    → reverse-proxy ─▶ pocketbase :8090 (REST + admin)
                                                                      └─ pb_data volume (SQLite)
```

- The SPA talks to PocketBase over same-origin `/api`, so there's no CORS and it works from any
  device on your network.
- The Mapbox token is written into a static `config.js` at container start (`envsubst`), so you can
  change it without rebuilding the image.

### Data model

`holidays` → `subperiods` → `places` (deleting a holiday cascades to its sub-periods and places).

- **holidays**: title, start/end dates, location, `countryCode` (drives the theme), accent override, emoji, notes
- **subperiods**: name, dates, color, and the **stay** (name, address, lat/lng, country)
- **places**: name, address, lat/lng, category, notes, and cached `driveSeconds` / `driveMeters`

---

## 🧑‍💻 Local development (without Docker)

```bash
# terminal 1 — backend (PocketBase binary in ./backend, or download from pocketbase.io)
cd backend && ./pocketbase serve --http=0.0.0.0:8090

# terminal 2 — frontend
cd frontend
cp .env.example .env            # set VITE_MAPBOX_TOKEN=pk....
npm install
npm run dev                     # http://localhost:5173 (proxies /api + /_/ to :8090)
```

Useful scripts in `frontend/`: `npm run dev`, `npm run build`, `npm run typecheck`.

---

## 🎨 Designs

Excalidraw wireframes for every screen live in [`designs/`](designs/) (open with the VS Code
Excalidraw extension or on excalidraw.com). They're generated by
[`designs/generate-designs.mjs`](designs/generate-designs.mjs).

---

## 🔒 Security

This app has **no login** and its data API is **public** — it's designed to run locally or on a
private network for a single user. **Do not expose it to the public internet as-is.** To do that
safely, add PocketBase authentication (a `users` collection + owner-scoped API rules) and lock down
the collections' API rules in `backend/pb_migrations/`.

## 🧹 Resetting data

A sample "Summer in Tuscany" holiday is seeded for you to explore. To start from an empty slate:

```bash
docker compose down -v   # ⚠ deletes the pb_data volume (all holidays)
docker compose up --build
```
