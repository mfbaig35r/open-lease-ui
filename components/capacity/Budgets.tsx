"use client";

// Spend ceilings (open-lease plan Tier A2). A budget is the claim the whole project rests on: GPU
// spend has a knowable ceiling rather than an open meter. So this view leads with spend against the
// limit, and says plainly what happens when it is reached.

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { useBudgetActions, useBudgets, useDeployments } from "@/lib/hooks";
import type { BudgetAction, BudgetStatus, BudgetWindow } from "@/lib/types";
import { Panel } from "../deployment/Panel";

const ACTION_COPY: Record<BudgetAction, string> = {
  warn: "logs an event",
  stop: "tears capacity down",
  block_new: "refuses new deploys",
};

export function Budgets() {
  const budgets = useBudgets();
  const actions = useBudgetActions();
  const [adding, setAdding] = useState(false);

  // Severity leads: an exceeded ceiling is the thing to act on, then whatever is closest to one.
  const rows = [...(budgets.data ?? [])].sort(
    (a, b) => Number(b.exceeded) - Number(a.exceeded) || b.fraction - a.fraction,
  );

  return (
    <Panel
      title="Spend ceilings"
      right={
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
        >
          {adding ? "cancel" : "+ add"}
        </button>
      }
    >
      {adding && (
        <div className="mb-5 border-b border-rule pb-5">
          <BudgetForm onDone={() => setAdding(false)} />
        </div>
      )}

      {budgets.isError ? (
        <p className="font-mono text-small text-ink-muted">unavailable</p>
      ) : rows.length === 0 ? (
        <p className="max-w-[62ch] text-small text-ink-muted">
          No ceiling set. Spend runs until something stops it. A budget caps a daily or monthly
          window, account-wide or for one deployment, and the daemon enforces it.
        </p>
      ) : (
        <ul className="divide-y divide-rule/60">
          {rows.map((row) => (
            <BudgetRow
              key={row.budget.id}
              row={row}
              onRemove={() => actions.remove.mutate(row.budget.id)}
              removing={actions.remove.isPending}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function BudgetRow({
  row,
  onRemove,
  removing,
}: {
  row: BudgetStatus;
  onRemove: () => void;
  removing: boolean;
}) {
  const { budget, spent_usd, fraction, over_warn, exceeded } = row;
  const pct = Math.min(100, Math.round(fraction * 100));
  const tone = exceeded ? "bg-danger" : over_warn ? "bg-warn" : "bg-accent";
  const scope = budget.deployment_id ?? "account-wide";

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3 font-mono text-small">
        <div className="min-w-0">
          <span className="text-ink-strong">{formatUSD(budget.limit_usd)}</span>
          <span className="text-ink-muted"> / {budget.window}</span>
          <span className="text-ink-muted"> · {scope}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={cn("tabular-nums", exceeded ? "text-danger" : over_warn ? "text-warn" : "text-ink")}>
            {formatUSD(spent_usd)} ({pct}%)
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="text-label text-ink-muted transition-colors hover:text-danger"
          >
            remove
          </button>
        </div>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-rule">
        <div className={cn("h-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 font-mono text-label text-ink-muted">
        {exceeded ? "over the ceiling · " : ""}
        on exceed: {budget.on_exceed.replace("_", " ")} ({ACTION_COPY[budget.on_exceed]})
      </p>
    </li>
  );
}

function BudgetForm({ onDone }: { onDone: () => void }) {
  const actions = useBudgetActions();
  const deployments = useDeployments(true);
  const [limit, setLimit] = useState("500");
  const [window, setWindow] = useState<BudgetWindow>("monthly");
  const [onExceed, setOnExceed] = useState<BudgetAction>("stop");
  const [scope, setScope] = useState("");

  const amount = Number(limit);
  const invalid = !Number.isFinite(amount) || amount <= 0 ? "limit must be more than $0" : null;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="ol-label mb-1.5">Limit (USD)</span>
          <input value={limit} onChange={(e) => setLimit(e.target.value)} className="ol-control" />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Window</span>
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value as BudgetWindow)}
            className="ol-control"
          >
            <option value="daily">daily</option>
            <option value="monthly">monthly</option>
          </select>
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">On exceed</span>
          <select
            value={onExceed}
            onChange={(e) => setOnExceed(e.target.value as BudgetAction)}
            className="ol-control"
          >
            <option value="warn">warn</option>
            <option value="stop">stop</option>
            <option value="block_new">block new</option>
          </select>
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Scope</span>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="ol-control">
            <option value="">account-wide</option>
            {(deployments.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.model_id} · {d.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 max-w-[62ch] font-mono text-label text-ink-muted">
        {onExceed === "stop"
          ? "A stop budget tears the in-scope deployments down for the rest of the window, and outranks a schedule."
          : onExceed === "block_new"
            ? "New deploys are refused while over the ceiling; anything already running keeps going."
            : "A warn budget only emits an event. Nothing is torn down."}
      </p>

      {(invalid || actions.create.isError) && (
        <p className="mt-2 text-small text-danger">
          {invalid ?? (actions.create.error as Error).message}
        </p>
      )}

      <div className="mt-3">
        <button
          type="button"
          disabled={!!invalid || actions.create.isPending}
          onClick={() =>
            actions.create.mutate(
              {
                limit_usd: amount,
                window,
                on_exceed: onExceed,
                deployment_id: scope || null,
              },
              { onSuccess: onDone },
            )
          }
          className="ol-btn"
        >
          {actions.create.isPending ? "Saving…" : "Set ceiling"}
        </button>
      </div>
    </div>
  );
}
