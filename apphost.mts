// Aspire TypeScript AppHost — local-dev orchestration for the VacationPlanner stack.
//   - pocketbase: backend container built from backend/Dockerfile (no typed Aspire
//                 integration exists for PocketBase, so we reuse the Dockerfile).
//   - frontend:   React/Vite dev server, proxying /api and /_ to PocketBase.
// docker-compose.yml remains the production path; this AppHost replaces the manual
// two-terminal dev flow. Run with `aspire run`.

import { createBuilder, ContainerLifetime } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

// Config migrated from .env (the file is kept intact — the docker-compose path still uses it).
const mapboxToken  = builder.addParameter('mapbox-token', { secret: true });
const pbAdminEmail = builder.addParameter('pb-admin-email');
const pbAdminPass  = builder.addParameter('pb-admin-password', { secret: true });

// Server-side-only config for place photos + object storage.
// The Google Places key is a bare secret parameter (like mapbox-token): Aspire prompts for it
// in the dashboard on first run (masked), persists it to user secrets for later runs, and only
// starts the PocketBase container once it's provided. The S3 settings stay optional with
// env-sourced defaults — set them in .env / compose, or make them bare params too if you'd
// rather enter them in the dashboard. All hooks no-op when their values are blank/disabled.
const env = (name: string) => process.env[name] ?? '';
const googlePlacesKey = builder.addParameter('google-places-api-key', { secret: true });
const apifyToken      = builder.addParameter('apify-token',          { secret: true }); // bare secret like google-places-api-key — Aspire persists it to user secrets (don't pass an env-sourced value: '' would clobber the saved secret each run)
const s3Enabled       = builder.addParameter('s3-enabled',          { value: env('S3_ENABLED') });
const s3Bucket        = builder.addParameter('s3-bucket',           { value: env('S3_BUCKET') });
const s3Region        = builder.addParameter('s3-region',           { value: env('S3_REGION') });
const s3Endpoint      = builder.addParameter('s3-endpoint',         { value: env('S3_ENDPOINT') });
const s3AccessKey     = builder.addParameter('s3-access-key',       { secret: true, value: env('S3_ACCESS_KEY') });
const s3Secret        = builder.addParameter('s3-secret',           { secret: true, value: env('S3_SECRET') });
const s3ForcePathStyle = builder.addParameter('s3-force-path-style', { value: env('S3_FORCE_PATH_STYLE') });

// PocketBase backend. The container listens on :8090 (set in backend/docker-entrypoint.sh);
// Aspire assigns the host/proxy port dynamically and the frontend discovers it below.
const pocketbase = await builder.addDockerfile('pocketbase', './backend')
    .withHttpEndpoint({ targetPort: 8090 })
    .withEnvironment('PB_ADMIN_EMAIL', pbAdminEmail)
    .withEnvironment('PB_ADMIN_PASSWORD', pbAdminPass)
    .withEnvironment('GOOGLE_PLACES_API_KEY', googlePlacesKey) // server-side photo fetch (never reaches the browser)
    .withEnvironment('APIFY_TOKEN', apifyToken)                // server-side Airbnb stay scrape (never reaches the browser)
    .withEnvironment('S3_ENABLED', s3Enabled)                  // optional object storage for uploaded photos
    .withEnvironment('S3_BUCKET', s3Bucket)
    .withEnvironment('S3_REGION', s3Region)
    .withEnvironment('S3_ENDPOINT', s3Endpoint)
    .withEnvironment('S3_ACCESS_KEY', s3AccessKey)
    .withEnvironment('S3_SECRET', s3Secret)
    .withEnvironment('S3_FORCE_PATH_STYLE', s3ForcePathStyle)
    .withVolume('/pb/pb_data', { name: 'vacationplanner-pb-data' }) // persist SQLite (compose pb_data)
    .withLifetime(ContainerLifetime.Persistent);

// Endpoint reference — Aspire resolves it to the dynamically-assigned URL at runtime.
const pbHttp = await pocketbase.getEndpoint('http');

// React/Vite frontend via the first-class Vite integration.
await builder.addViteApp('frontend', './frontend')
    .withNpm()                                       // standalone npm app — install deps before start
    .withHttpsDeveloperCertificate()                 // prefer HTTPS (dev cert is trusted per `aspire doctor`)
    .withHttpsEndpoint({ env: 'PORT' })              // Aspire-managed port, injected to Vite as PORT
    .withEnvironment('POCKETBASE_URL', pbHttp)       // endpoint reference — never a hardcoded URL
    .withEnvironment('VITE_MAPBOX_TOKEN', mapboxToken)
    .withEnvironment('BROWSER', 'none')              // don't auto-open a browser tab
    .waitFor(pocketbase)                             // mirrors compose depends_on + healthcheck
    .withExternalHttpEndpoints()                     // surface the SPA URL prominently in the dashboard
    .withBrowserLogs();                              // browser console + screenshots in the dashboard

await builder.build().run();
