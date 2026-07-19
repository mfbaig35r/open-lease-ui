"use client";

import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { useUsage } from "@/lib/hooks";
import type { UsageSummary } from "@/lib/types";
import { PageHeader } from "./PageHeader";

function tokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function perMTok(usd: number | null): string {
  return usd == null ? "—" : `$${usd.toFixed(2)}`;
}

export function Costs() {
  const usage = useUsage();
  const rows = (usage.data ?? []).filter((u) => u.requests > 0);
  const totalTokens = rows.reduce((s, u) => s + u.total_tokens, 0);
  const totalUsd = rows.reduce((s, u) => s + u.accrued_usd, 0);
  const blended = totalTokens > 0 ? (totalUsd / totalTokens) * 1_000_000 : null;

  return (
    <div>
      <PageHeader
        title="Costs"
        sub={
          <span className="ol-label">
            {usage.isError
              ? "disconnected"
              : rows.length === 0
                ? "no metered traffic yet"
                : `${tokens(totalTokens)} tokens · ${formatUSD(totalUsd)} · ${perMTok(blended)}/M tok blended`}
          </span>
        }
      />

      {usage.isError ? (
        <Disconnected message={(usage.error as Error).message} />
      ) : usage.isLoading ? (
        <p className="font-mono text-small text-ink-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <>
          <UsageTable rows={rows} blended={blended} totalTokens={totalTokens} totalUsd={totalUsd} />
          <p className="mt-4 max-w-[70ch] text-small text-ink-muted">
            <span className="text-accent-soft">$/M tok</span> is your effective cost per million
            tokens on this hardware. Compare it directly to a hosted API&apos;s per-token price.{" "}
            <span className="text-accent-soft">tok/s</span> is utilization: how busy the GPU actually
            is. Both improve the more traffic you drive through one deployment.
          </p>
        </>
      )}
    </div>
  );
}

function UsageTable({
  rows,
  blended,
  totalTokens,
  totalUsd,
}: {
  rows: UsageSummary[];
  blended: number | null;
  totalTokens: number;
  totalUsd: number;
}) {
  const grid = "grid grid-cols-[minmax(0,2.4fr)_1fr_1.1fr_1fr_1.2fr_1.2fr] gap-x-4 px-4";
  const num = "text-right tabular-nums";
  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
      <div className="min-w-[640px]">
        <div className={cn(grid, "border-b border-rule py-2.5 ol-label text-ink-muted")}>
          <span>Model</span>
          <span className={num}>Requests</span>
          <span className={num}>Tokens</span>
          <span className={num}>Tok/s</span>
          <span className={num}>Accrued</span>
          <span className={num}>$/M tok</span>
        </div>
        {rows.map((u) => (
          <div
            key={u.deployment_id}
            className={cn(grid, "items-center border-b border-rule/60 py-2.5 font-mono last:border-0")}
          >
            <div className="min-w-0">
              <div className="truncate text-ink-strong">{u.model_id}</div>
              <div className="truncate text-label text-ink-muted">{u.deployment_id}</div>
            </div>
            <span className={cn(num, "text-ink")}>{u.requests.toLocaleString("en-US")}</span>
            <span className={cn(num, "text-ink")}>{tokens(u.total_tokens)}</span>
            <span className={cn(num, "text-ink")}>{u.tokens_per_sec.toFixed(1)}</span>
            <span className={cn(num, "text-ink")}>{formatUSD(u.accrued_usd)}</span>
            <span className={cn(num, "text-accent-soft")}>{perMTok(u.cost_per_mtok)}</span>
          </div>
        ))}
        <div className={cn(grid, "border-t border-rule py-2.5 font-mono ol-label text-ink-muted")}>
          <span>Total</span>
          <span />
          <span className={cn(num, "text-ink-strong")}>{tokens(totalTokens)}</span>
          <span />
          <span className={cn(num, "text-ink-strong")}>{formatUSD(totalUsd)}</span>
          <span className={cn(num, "text-accent-soft")}>{perMTok(blended)}</span>
        </div>
      </div>
    </div>
  );
}

function Disconnected({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-8">
      <p className="text-h3 text-ink-strong">Cannot reach the API</p>
      <p className="mt-2 max-w-[52ch] text-body text-ink-muted">{message}</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-surface/40 p-10 text-center">
      <p className="text-h3 text-ink-strong">No usage yet</p>
      <p className="mt-2 text-body text-ink-muted">
        Send requests through the proxy and per-model token throughput and cost land here.
      </p>
      <p className="mt-4 font-mono text-small text-ink-muted">
        <code className="rounded bg-canvas px-1.5 py-0.5 text-accent-soft">
          curl localhost:8000/v1/chat/completions …
        </code>
      </p>
    </div>
  );
}
