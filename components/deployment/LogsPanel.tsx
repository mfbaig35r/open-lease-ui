"use client";

import { useLogs } from "@/lib/hooks";
import { Panel } from "./Panel";

export function LogsPanel({ id }: { id: string }) {
  const { data, isError } = useLogs(id);
  const lines = data ?? [];

  return (
    <Panel
      title="Logs"
      right={
        <span className="font-mono text-label tabular-nums text-ink-muted">
          {lines.length ? `${lines.length} lines` : ""}
        </span>
      }
    >
      {isError ? (
        <p className="font-mono text-small text-ink-muted">unavailable</p>
      ) : lines.length === 0 ? (
        // RunPod has no log API, so this is often empty; state it plainly.
        <p className="font-mono text-small text-ink-muted">
          no logs available from this provider
        </p>
      ) : (
        <pre className="max-h-[360px] overflow-auto rounded-sm bg-canvas p-3 font-mono text-label leading-relaxed text-ink">
          {lines.join("\n")}
        </pre>
      )}
    </Panel>
  );
}
