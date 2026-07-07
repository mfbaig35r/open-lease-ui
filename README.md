# open-lease-ui

A local, visual workbench for [open-lease](https://github.com/mfbaig35r/open-lease): watch your GPU
deployments come up and run, and use the models you spin up. Another thin interface over the same
core, talking to the REST API over HTTP.

> Overview, deployment detail, deploy wizard, and chat playground are all in. Next: the static
> export + a `gpu ui` launcher. See [docs/requirements.md](docs/requirements.md) for the full plan.

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
