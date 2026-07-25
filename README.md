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

Two ways, both automatic.

**Bundled into the open-lease wheel**, which is how `gpu ui` serves it locally. `pnpm bundle` builds a
static export into `open-lease/src/gpu_orchestrator/web`, and open-lease's publish workflow does the
same build at release time.

**Hosted at [workbench.openlease.canonicalresearch.dev](https://workbench.openlease.canonicalresearch.dev)**,
deployed on a version tag by `.github/workflows/deploy.yml`, so what is live matches a release rather
than whatever last landed on `main`. Pushing to `main` deliberately does not deploy
(`git.deploymentEnabled` in `vercel.json`); pull requests still get preview deployments from Vercel's
git integration. `workflow_dispatch` covers a hosted-only fix that should go live without a release.

The hosted build sets `NEXT_PUBLIC_WORKBENCH_HOSTED=1`, so that copy starts unconnected and asks the
visitor to point it at their own local server (see `lib/connection.ts`); the bundled copy assumes
same-origin.

That workflow builds this repo **at the release's own tag**: open-lease `v0.5.0` bundles the workbench
tagged `v0.5.0` here. So versions move in lockstep and the backend tag names the workbench, with
nothing to keep in step by hand. Tag this repo `vX.Y.Z` before cutting open-lease `vX.Y.Z`, or the
release fails asking for the tag. `scripts/release.py` in open-lease does both in order; the details
are in
[open-lease/CONTRIBUTING.md](https://github.com/mfbaig35r/open-lease/blob/main/CONTRIBUTING.md).
