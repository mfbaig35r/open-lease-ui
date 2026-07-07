"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDuration, formatUSD } from "@/lib/format";
import { useCosts, useDeployment, useDeploymentActions } from "@/lib/hooks";
import { isBilling } from "@/lib/state";
import { useNow } from "@/lib/useNow";
import { StateBadge } from "../StateBadge";
import { EndpointDocs } from "./EndpointDocs";
import { EventFeed } from "./EventFeed";
import { HealthPanel } from "./HealthPanel";
import { LogsPanel } from "./LogsPanel";
import { StateTimeline } from "./StateTimeline";

function BackLink() {
  return (
    <Link
      href="/"
      className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase transition-colors hover:text-ink-strong"
    >
      &larr; Overview
    </Link>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase">{label}</p>
      <p className={cn("mt-1 truncate font-mono text-small tabular-nums text-ink-strong", tone)}>
        {value}
      </p>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn("ol-btn ol-btn-ghost", danger && "ol-btn-danger")}
    >
      {busy ? "…" : children}
    </button>
  );
}

export function DeploymentDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: dep, isError, error, isLoading } = useDeployment(id);
  const costs = useCosts();
  const actions = useDeploymentActions(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const active = dep ? isBilling(dep.observed_state) : false;
  const now = useNow(active);

  if (isLoading) return <p className="font-mono text-small text-ink-muted">Loading…</p>;
  if (isError || !dep)
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-body text-ink-muted">
          {(error as Error)?.message ?? "Deployment not found."}
        </p>
      </div>
    );

  const cost = costs.data?.get(dep.id);
  const startMs = Date.parse(cost?.started_at ?? dep.created_at);
  const endMs = active ? now : Date.parse(cost?.stopped_at ?? dep.updated_at);
  const accrued =
    cost != null ? (cost.gpu_hourly_usd * Math.max(0, endMs - startMs)) / 3_600_000 : null;
  const serving = dep.observed_state === "ready";

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    actions.remove.mutate(undefined, { onSuccess: () => router.push("/") });
  };

  return (
    <div>
      <BackLink />
      <header className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-h1 font-semibold text-ink-strong">{dep.model_id}</h1>
            <StateBadge state={dep.observed_state} />
          </div>
          {dep.hf_repo && (
            <p className="mt-1 truncate font-mono text-small text-ink-muted">{dep.hf_repo}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {active && (
            <ActionBtn onClick={() => actions.stop.mutate()} busy={actions.stop.isPending}>
              Stop
            </ActionBtn>
          )}
          <ActionBtn onClick={() => actions.restart.mutate()} busy={actions.restart.isPending}>
            Restart
          </ActionBtn>
          <ActionBtn danger onClick={onDelete} busy={actions.remove.isPending}>
            {confirmDelete ? "Confirm delete" : "Delete"}
          </ActionBtn>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-rule bg-surface p-5 sm:grid-cols-4">
        <Fact label="GPU" value={dep.instance?.gpu_type ?? dep.profile.recommended_gpu} />
        <Fact
          label="Uptime"
          value={dep.observed_state === "requested" ? "—" : formatDuration(endMs - startMs)}
        />
        <Fact
          label="Accrued"
          value={accrued != null ? formatUSD(accrued) : "—"}
          tone={active ? "text-accent" : undefined}
        />
        <Fact label="Provider" value={dep.provider} />
        <Fact label="Context" value={dep.context_window ? String(dep.context_window) : "auto"} />
        <Fact label="Image" value={dep.profile.image} />
        <Fact label="Deployment" value={dep.id} />
      </div>

      <EndpointDocs dep={dep} serving={serving} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <StateTimeline history={dep.state_history} now={now} />
          <HealthPanel id={id} />
        </div>
        <EventFeed id={id} />
      </div>
      <div className="mt-4">
        <LogsPanel id={id} />
      </div>
    </div>
  );
}
