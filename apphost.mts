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

// PocketBase backend. The container listens on :8090 (set in backend/docker-entrypoint.sh);
// Aspire assigns the host/proxy port dynamically and the frontend discovers it below.
const pocketbase = await builder.addDockerfile('pocketbase', './backend')
    .withHttpEndpoint({ targetPort: 8090 })
    .withEnvironment('PB_ADMIN_EMAIL', pbAdminEmail)
    .withEnvironment('PB_ADMIN_PASSWORD', pbAdminPass)
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
