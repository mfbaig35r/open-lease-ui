# open-lease-ui

A local, visual workbench for [open-lease](https://github.com/mfbaig35r/open-lease): watch your GPU
deployments come up and run, and use the models you spin up. Another thin interface over the same
core, talking to the REST API over HTTP.

> Overview, deployment detail, deploy wizard, chat playground, costs, and the capacity envelope
> (spend ceilings, schedules, concurrency limits, replicas, autoscaling) are all in. See
> [docs/requirements.md](docs/requirements.md) for the full plan.

## Run it

Start the open-lease REST API, then the UI:

```bash
# in the open-lease repo
gpu serve                 # REST API on http://localhost:8000

# here
cp .env.example .env.local # (defaults to http://localhost:8000; edit if elsewhere)
pnpm install
pnpm dev                   # http://localhost:3000
```

The Overview polls `/deployments` and `/costs`, so deployments animate through their lifecycle and
the cost meter ticks live. Deploy something (`gpu deploy qwen3-0.6b --wait`) to watch it appear.

## Stack

Next.js (App Router) + Tailwind v4 + TanStack Query, reusing the OpenLease site design language. No
open-lease core imports: it knows only the REST endpoints and the `/v1/*` proxy.

## How this ships

This is never published on its own. `pnpm bundle` builds a static export into
`open-lease/src/gpu_orchestrator/web`, and open-lease's publish workflow does the same build so the
released wheel serves the workbench at `gpu ui`.

That workflow builds this repo **at the release's own tag**: open-lease `v0.5.0` bundles the workbench
tagged `v0.5.0` here. So versions move in lockstep and the backend tag names the workbench, with
nothing to keep in step by hand. Tag this repo `vX.Y.Z` before cutting open-lease `vX.Y.Z`, or the
release fails asking for the tag. `scripts/release.py` in open-lease does both in order; the details
are in
[open-lease/CONTRIBUTING.md](https://github.com/mfbaig35r/open-lease/blob/main/CONTRIBUTING.md).
