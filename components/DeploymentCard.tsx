"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDuration, formatUSD, shortEndpoint } from "@/lib/format";
import { isBilling } from "@/lib/state";
import type { CostRecord, Deployment } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { StateBadge } from "./StateBadge";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase">{label}</p>
      <p className={cn("mt-1 font-mono text-small tabular-nums text-ink-strong", tone)}>{value}</p>
    </div>
  );
}

export function DeploymentCard({ dep, cost }: { dep: Deployment; cost?: CostRecord }) {
  const active = isBilling(dep.observed_state);
  const now = useNow(active);

  const startMs = Date.parse(cost?.started_at ?? dep.created_at);
  const endMs = active ? now : Date.parse(cost?.stopped_at ?? dep.updated_at);
  const uptime = formatDuration(endMs - startMs);
  const accrued =
    cost != null ? (cost.gpu_hourly_usd * Math.max(0, endMs - startMs)) / 3_600_000 : null;

  const gpu = dep.instance?.gpu_type ?? dep.profile.recommended_gpu;
  const host = shortEndpoint(dep.endpoint_url);
  const pct =
    dep.download_progress != null ? Math.round(dep.download_progress * 100) : null;

  return (
    <Link
      href={`/deployment?id=${dep.id}`}
      className="block rounded-sm border border-rule bg-surface p-5 transition-colors hover:border-rule-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-h3 font-semibold text-ink-strong">{dep.model_id}</p>
          {dep.hf_repo && (
            <p className="truncate font-mono text-label text-ink-muted">{dep.hf_repo}</p>
          )}
        </div>
        <StateBadge state={dep.observed_state} />
      </div>

      {pct != null && dep.observed_state !== "ready" && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between font-mono text-label text-ink-muted">
            <span>downloading</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-rule">
            <div className="h-full bg-warn transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Stat label="GPU" value={gpu} />
        <Stat label="Uptime" value={active ? uptime : dep.observed_state === "requested" ? "—" : uptime} />
        <Stat
          label="Accrued"
          value={accrued != null ? formatUSD(accrued) : "—"}
          tone={active ? "text-accent" : undefined}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 font-mono text-label text-ink-muted">
        <span className="uppercase tracking-[0.04em]">{dep.provider}</span>
        {dep.observed_state === "ready" && host ? (
          <span className="inline-flex items-center gap-1.5 text-accent-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-accent ol-pulse" />
            <span className="truncate">{host}</span>
          </span>
        ) : dep.observed_state === "failed" && dep.failure ? (
          <span className="truncate text-danger" title={dep.failure.message}>
            {dep.failure.message}
          </span>
        ) : (
          <span>{dep.id}</span>
        )}
      </div>
    </Link>
  );
}
