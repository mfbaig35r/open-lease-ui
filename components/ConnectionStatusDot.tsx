"use client";

import type { ConnStatus } from "@/lib/connection";

const CFG: Record<ConnStatus, { dot: string; label: string; pulse: boolean }> = {
  connected: { dot: "bg-accent", label: "Connected", pulse: false },
  connecting: { dot: "bg-warn", label: "Connecting", pulse: true },
  unknown: { dot: "bg-ink-muted", label: "Not connected", pulse: false },
  error: { dot: "bg-danger", label: "Error", pulse: false },
};

export function ConnectionStatusDot({ status }: { status: ConnStatus }) {
  const { dot, label, pulse } = CFG[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? "ol-pulse" : ""}`} />
      <span className="ol-label">{label}</span>
    </span>
  );
}
