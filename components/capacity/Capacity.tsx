"use client";

// The account-scoped half of the capacity envelope: spend ceilings and replica policy. The
// deployment-scoped half (a schedule, a concurrency limit) lives on each deployment's detail page,
// where the thing it applies to is on screen.

import { useBudgets, useDeployments } from "@/lib/hooks";
import { PageHeader } from "../PageHeader";
import { Budgets } from "./Budgets";
import { Replicas } from "./Replicas";

export function Capacity() {
  const budgets = useBudgets();
  const deployments = useDeployments(true);

  const held = (deployments.data ?? []).filter((d) => d.budget_hold);
  const ceilings = budgets.data?.length ?? 0;
  const exceeded = (budgets.data ?? []).filter((b) => b.exceeded).length;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Capacity"
        sub={
          <span className="ol-label">
            {budgets.isError
              ? "disconnected"
              : ceilings === 0
                ? "no spend ceiling set"
                : `${ceilings} ceiling${ceilings === 1 ? "" : "s"}${exceeded ? ` · ${exceeded} exceeded` : ""}`}
          </span>
        }
      />

      {held.length > 0 && (
        <div className="mb-6 rounded-lg border border-danger/40 bg-danger/5 p-4">
          <p className="font-mono text-small text-danger">
            {held.length} deployment{held.length === 1 ? "" : "s"} held down by a budget
          </p>
          <p className="mt-1 max-w-[62ch] text-small text-ink-muted">
            A stop budget is over its ceiling, so {held.length === 1 ? "it stays" : "they stay"} torn
            down for the rest of the window: {held.map((d) => d.id).join(", ")}. Raise or remove the
            ceiling to release {held.length === 1 ? "it" : "them"}.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Budgets />
        <Replicas />
      </div>

      <p className="mt-6 max-w-[70ch] text-small text-ink-muted">
        Schedules and per-deployment concurrency limits live on each deployment&apos;s page. All of it
        is enforced by the daemon and the proxy, so a ceiling holds whether it was set here, from the
        CLI, or by an agent over MCP.
      </p>
    </div>
  );
}
