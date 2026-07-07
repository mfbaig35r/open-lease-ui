"use client";

import { API_URL } from "@/lib/api";
import { useCosts, useDeployments } from "@/lib/hooks";
import { isBilling } from "@/lib/state";
import type { Deployment } from "@/lib/types";
import { DeploymentCard } from "./DeploymentCard";
import { PageHeader } from "./PageHeader";

function orderedActiveFirst(a: Deployment, b: Deployment): number {
  const ba = isBilling(a.observed_state) ? 0 : 1;
  const bb = isBilling(b.observed_state) ? 0 : 1;
  if (ba !== bb) return ba - bb;
  return Date.parse(b.updated_at) - Date.parse(a.updated_at);
}

export function Overview() {
  const deployments = useDeployments(true);
  const costs = useCosts();

  const rows = deployments.data ? [...deployments.data].sort(orderedActiveFirst) : [];
  const live = rows.filter((d) => isBilling(d.observed_state)).length;

  return (
    <div>
      <PageHeader
        title="Overview"
        sub={
          <span className="ol-label">
            {deployments.isError
              ? "disconnected"
              : `${rows.length} deployment${rows.length === 1 ? "" : "s"} · ${live} live`}
          </span>
        }
        actions={
          <ConnectionDot
            ok={!deployments.isError && !deployments.isLoading}
            loading={deployments.isLoading}
          />
        }
      />

      {deployments.isError ? (
        <Disconnected message={(deployments.error as Error).message} />
      ) : deployments.isLoading ? (
        <p className="font-mono text-small text-ink-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <DeploymentCard key={d.id} dep={d} cost={costs.data?.get(d.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionDot({ ok, loading }: { ok: boolean; loading: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-label tracking-[0.04em] text-ink-muted uppercase">
      <span
        className={
          loading
            ? "h-1.5 w-1.5 rounded-full bg-ink-muted"
            : ok
              ? "h-1.5 w-1.5 rounded-full bg-accent"
              : "h-1.5 w-1.5 rounded-full bg-danger"
        }
      />
      {API_URL.replace(/^https?:\/\//, "")}
    </span>
  );
}

function Disconnected({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-8">
      <p className="text-h3 text-ink-strong">Cannot reach the API</p>
      <p className="mt-2 max-w-[52ch] text-body text-ink-muted">{message}</p>
      <p className="mt-4 font-mono text-small text-ink-muted">
        Start the backend with{" "}
        <code className="rounded bg-canvas px-1.5 py-0.5 text-accent-soft">gpu serve</code>, then set{" "}
        <code className="rounded bg-canvas px-1.5 py-0.5 text-accent-soft">NEXT_PUBLIC_API_URL</code>{" "}
        if it is not on {API_URL}.
      </p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-surface/40 p-10 text-center">
      <p className="text-h3 text-ink-strong">Nothing running</p>
      <p className="mt-2 text-body text-ink-muted">Deploy a model to watch it come up here.</p>
      <p className="mt-4 font-mono text-small text-ink-muted">
        <code className="rounded bg-canvas px-1.5 py-0.5 text-accent-soft">
          gpu deploy qwen3-0.6b --wait
        </code>
      </p>
    </div>
  );
}
