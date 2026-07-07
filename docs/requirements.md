# open-lease-ui: the workbench

A local, visual front end for [open-lease](https://github.com/mfbaig35r/open-lease). It shows the
orchestration engine at work (deployments moving through their lifecycle, cost accruing, events
streaming) and lets you use the models you spin up (a chat playground over the OpenAI-compatible
proxy). One product with the CLI, REST API, and MCP server: another thin interface over the same
core.

## Principles

- **Backend is the REST API, over HTTP only.** No open-lease core imports. The UI knows only the
  Phase 2 endpoints and the `/v1/*` proxy (see `open-lease/docs/phase-4-swamp.md` for the pinned
  contract). If a view needs data the API does not expose, that is a change to the API, not a
  workaround here.
- **Local-first, not hosted.** open-lease state is a local SQLite db, credentials are local, RunPod
  is the only cloud. This is a local app, not a multi-tenant SaaS.
- **Make the reconcile loop visible.** The differentiator: most GPU tooling is an opaque script.
  open-lease is a state machine with cost-safety by construction, so the UI's job is to show the
  machine thinking, and to make "no pod bills forever" something you can watch.

## Architecture

- **Stack**: Next.js (App Router) + Tailwind v4 + TanStack Query, TypeScript. Reuses the OpenLease
  site design tokens (dark canvas, teal accent, Geist, mono labels) so it reads as one product.
- **Run modes**:
  - Dev: `pnpm dev`, pointed at a running `gpu serve` via `NEXT_PUBLIC_API_URL`
    (default `http://localhost:8000`).
  - Shipped (later slice): a static export (`next build`, `output: "export"`) that `gpu serve`
    serves at `/`, so `gpu ui` is one command that boots the API, the UI, and the browser.
- **Data layer**: a typed fetch client (`lib/api.ts`) with bearer-token auth
  (`NEXT_PUBLIC_API_TOKEN`, optional; unauthenticated on localhost) and TanStack Query hooks that
  poll (`/deployments` ~1s, detail on open). SSE `/events/stream` is a small later add to the API
  if polling ever feels laggy; nothing here assumes it yet.
- **Live cost/uptime**: `/costs` returns `gpu_hourly_usd` + `started_at` per deployment, so accrued
  cost and uptime tick client-side every second between polls (`rate x elapsed`), for the meter feel
  without hammering the API.

## Views (the workbench)

1. **Overview** (Slice 1): live deployment cards animating through `requested -> provisioning ->
   starting_server -> ready`, cost ticking, download percent mid-bringup. The hero: watch the loop.
2. **Deployment detail** (Slice 2): state timeline, the event feed (created / adopted / orphan
   swept / crash-cap / terminal), health checks, logs tail, accrued + projected cost, the endpoint.
3. **Deploy** (Slice 3): a wizard for a catalog model or an ad-hoc `--hf-repo`, a GPU picker showing
   live availability, and a cost estimate before you commit.
4. **Playground** (Slice 4): pick any READY deployment, chat and stream through `/v1/*`. The "use the
   model you just spun up" moment.
5. **Costs / catalog / providers**: the supporting reads.

## Build slices

- **Slice 1** (this one): scaffold, design-token port, typed API client + query hooks, and the
  Overview live cards. Proves the "feel alive" idea. Verified by build + typecheck + lint; visuals
  polished against reference designs before they are called final.
- **Slice 2**: deployment detail (timeline, event feed, logs, health).
- **Slice 3**: the Deploy wizard.
- **Slice 4**: the chat Playground.
- **Later**: static export + the `gpu ui` launcher in open-lease; optional SSE stream.

## Design

Extends the OpenLease site language. Workbench-specific density (how live cards pack, the event-feed
rhythm, the playground layout) is tuned against reference designs before final. Deployment state has
a small color language: ready = accent teal, coming-up = amber, degraded/failed = red, stopped =
muted.
