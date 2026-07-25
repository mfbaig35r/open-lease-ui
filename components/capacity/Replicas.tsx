"use client";

// Replicas + autoscaling per model (open-lease plan tiers B1 and B2). A replica is just another
// deployment of the same model, and the proxy round-robins across whatever is READY, so this view is
// grouped by model rather than by deployment: the model is the unit capacity is measured in.

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAutoscale, useAutoscaleActions, useDeployments, useScale } from "@/lib/hooks";
import { isBilling } from "@/lib/state";
import type { AutoscalePolicy, Deployment } from "@/lib/types";
import { Panel } from "../deployment/Panel";

interface ModelRow {
  modelId: string;
  active: Deployment[];
  ready: number;
  policy: AutoscalePolicy | null;
}

function groupByModel(deployments: Deployment[], policies: AutoscalePolicy[]): ModelRow[] {
  const byModel = new Map<string, Deployment[]>();
  for (const dep of deployments) {
    if (!isBilling(dep.observed_state) && dep.desired_state !== "ready") continue;
    byModel.set(dep.model_id, [...(byModel.get(dep.model_id) ?? []), dep]);
  }
  // A policy with nothing running still matters: it is why replicas will appear under load.
  for (const p of policies) if (!byModel.has(p.model_id)) byModel.set(p.model_id, []);

  return [...byModel.entries()]
    .map(([modelId, active]) => ({
      modelId,
      active,
      ready: active.filter((d) => d.observed_state === "ready").length,
      policy: policies.find((p) => p.model_id === modelId) ?? null,
    }))
    .sort((a, b) => b.active.length - a.active.length || a.modelId.localeCompare(b.modelId));
}

export function Replicas() {
  const deployments = useDeployments(true);
  const policies = useAutoscale();
  const scale = useScale();
  const [editing, setEditing] = useState<string | null>(null);

  const rows = groupByModel(deployments.data ?? [], policies.data ?? []);

  return (
    <Panel title="Replicas">
      {deployments.isError ? (
        <p className="font-mono text-small text-ink-muted">unavailable</p>
      ) : rows.length === 0 ? (
        <p className="max-w-[62ch] text-small text-ink-muted">
          Nothing running. Deploy a model, then add replicas here to serve more traffic through one
          endpoint, or set an autoscaling policy so the replica count follows demand.
        </p>
      ) : (
        <ul className="divide-y divide-rule/60">
          {rows.map((row) => (
            <li key={row.modelId} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-small text-ink-strong">{row.modelId}</p>
                  <p className="font-mono text-label text-ink-muted">
                    {row.active.length === 0
                      ? "no replicas running"
                      : `${row.active.length} replica${row.active.length === 1 ? "" : "s"} · ${row.ready} ready`}
                  </p>
                </div>
                <Stepper
                  count={row.active.length}
                  busy={scale.isPending}
                  onSet={(replicas) => scale.mutate({ modelId: row.modelId, replicas })}
                />
              </div>

              {editing === row.modelId ? (
                <div className="mt-3">
                  <AutoscaleForm
                    modelId={row.modelId}
                    policy={row.policy}
                    onDone={() => setEditing(null)}
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3 font-mono text-label">
                  <PolicySummary policy={row.policy} />
                  <button
                    type="button"
                    onClick={() => setEditing(row.modelId)}
                    className="shrink-0 text-ink-muted transition-colors hover:text-ink-strong"
                  >
                    {row.policy ? "edit autoscaling" : "set autoscaling"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {scale.isError && (
        <p className="mt-4 text-small text-danger">{(scale.error as Error).message}</p>
      )}
    </Panel>
  );
}

function PolicySummary({ policy }: { policy: AutoscalePolicy | null }) {
  if (policy == null) return <span className="text-ink-muted">manual replica count</span>;
  return (
    <span className="text-accent-soft">
      autoscaling {policy.min_replicas}&ndash;{policy.max_replicas} at{" "}
      {policy.target_rpm_per_replica}
      <span className="text-ink-muted"> req/min each</span>
    </span>
  );
}

function Stepper({
  count,
  busy,
  onSet,
}: {
  count: number;
  busy: boolean;
  onSet: (replicas: number) => void;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md border border-rule font-mono text-small text-ink transition-colors hover:border-rule-strong hover:text-ink-strong disabled:opacity-40";
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        aria-label="one fewer replica"
        disabled={busy || count <= 0}
        onClick={() => onSet(count - 1)}
        className={btn}
      >
        &minus;
      </button>
      <span className="w-6 text-center font-mono text-small tabular-nums text-ink-strong">
        {count}
      </span>
      <button
        type="button"
        aria-label="one more replica"
        // Scaling up clones an existing member, so there has to be one to clone.
        disabled={busy || count === 0}
        onClick={() => onSet(count + 1)}
        className={cn(btn, count === 0 && "cursor-not-allowed")}
        title={count === 0 ? "deploy this model first, then add replicas" : undefined}
      >
        +
      </button>
    </div>
  );
}

function AutoscaleForm({
  modelId,
  policy,
  onDone,
}: {
  modelId: string;
  policy: AutoscalePolicy | null;
  onDone: () => void;
}) {
  const actions = useAutoscaleActions();
  const [min, setMin] = useState(String(policy?.min_replicas ?? 1));
  const [max, setMax] = useState(String(policy?.max_replicas ?? 3));
  const [target, setTarget] = useState(String(policy?.target_rpm_per_replica ?? 30));

  const nMin = Number(min);
  const nMax = Number(max);
  const nTarget = Number(target);
  const invalid =
    !Number.isInteger(nMin) || nMin < 1
      ? "min must be a whole number, 1 or more"
      : !Number.isInteger(nMax) || nMax < nMin
        ? "max must be a whole number, at least the min"
        : !Number.isFinite(nTarget) || nTarget <= 0
          ? "target must be more than 0 req/min"
          : null;

  return (
    <div className="rounded-md border border-rule bg-canvas/40 p-3">
      <div className="grid max-w-md grid-cols-3 gap-3">
        <label className="block">
          <span className="ol-label mb-1.5">Min</span>
          <input value={min} onChange={(e) => setMin(e.target.value)} className="ol-control" />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Max</span>
          <input value={max} onChange={(e) => setMax(e.target.value)} className="ol-control" />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Req/min each</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)} className="ol-control" />
        </label>
      </div>
      <p className="mt-3 max-w-[62ch] font-mono text-label text-ink-muted">
        The signal is served request rate, so set the target below what one replica can carry:
        requests already rejected at saturation are not part of it. Needs the daemon running.
      </p>
      {(invalid || actions.set.isError) && (
        <p className="mt-2 text-small text-danger">
          {invalid ?? (actions.set.error as Error).message}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={!!invalid || actions.set.isPending}
          onClick={() =>
            actions.set.mutate(
              {
                modelId,
                body: {
                  min_replicas: nMin,
                  max_replicas: nMax,
                  target_rpm_per_replica: nTarget,
                },
              },
              { onSuccess: onDone },
            )
          }
          className="ol-btn"
        >
          {actions.set.isPending ? "Saving…" : "Save policy"}
        </button>
        {policy && (
          <button
            type="button"
            disabled={actions.remove.isPending}
            onClick={() => actions.remove.mutate(modelId, { onSuccess: onDone })}
            className="font-mono text-label text-ink-muted transition-colors hover:text-danger"
          >
            remove policy
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
