"use client";

import { cn } from "@/lib/cn";
import { useHealth } from "@/lib/hooks";
import { Panel } from "./Panel";

const STATUS_TONE: Record<string, string> = {
  healthy: "text-accent",
  booting: "text-warn",
  degraded: "text-danger",
  failed: "text-danger",
};

export function HealthPanel({ id }: { id: string }) {
  const { data, isError } = useHealth(id);

  return (
    <Panel
      title="Health"
      right={
        data ? (
          <span
            className={cn(
              "font-mono text-label tracking-[0.04em] uppercase",
              STATUS_TONE[data.status] ?? "text-ink-muted",
            )}
          >
            {data.status}
          </span>
        ) : null
      }
    >
      {isError ? (
        <p className="font-mono text-small text-ink-muted">unavailable</p>
      ) : !data || Object.keys(data.checks).length === 0 ? (
        <p className="font-mono text-small text-ink-muted">no checks reported</p>
      ) : (
        <ul className="space-y-2">
          {Object.entries(data.checks).map(([name, check]) => (
            <li key={name} className="flex items-center justify-between gap-3 text-small">
              <span className="flex items-center gap-2 text-ink">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    check.ok ? "bg-accent" : "bg-danger",
                  )}
                />
                <span className="font-mono">{name}</span>
              </span>
              <span className="font-mono text-label tabular-nums text-ink-muted">
                {check.latency_ms != null ? `${Math.round(check.latency_ms)}ms` : check.detail || ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
