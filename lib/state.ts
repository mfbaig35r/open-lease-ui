import type { DeploymentState } from "./types";

export type Tone = "accent" | "warn" | "danger" | "muted";

export interface StateMeta {
  label: string;
  tone: Tone;
  comingUp: boolean; // pulse the dot while it works toward READY
}

export const STATE: Record<DeploymentState, StateMeta> = {
  requested: { label: "Requested", tone: "warn", comingUp: true },
  provisioning: { label: "Provisioning", tone: "warn", comingUp: true },
  booting: { label: "Booting", tone: "warn", comingUp: true },
  downloading_model: { label: "Downloading", tone: "warn", comingUp: true },
  starting_server: { label: "Starting", tone: "warn", comingUp: true },
  ready: { label: "Ready", tone: "accent", comingUp: false },
  degraded: { label: "Degraded", tone: "danger", comingUp: false },
  stopping: { label: "Stopping", tone: "muted", comingUp: true },
  stopped: { label: "Stopped", tone: "muted", comingUp: false },
  failed: { label: "Failed", tone: "danger", comingUp: false },
};

export const TONE_TEXT: Record<Tone, string> = {
  accent: "text-accent",
  warn: "text-warn",
  danger: "text-danger",
  muted: "text-ink-muted",
};

export const TONE_BG: Record<Tone, string> = {
  accent: "bg-accent",
  warn: "bg-warn",
  danger: "bg-danger",
  muted: "bg-ink-muted",
};

const BILLING: DeploymentState[] = [
  "provisioning",
  "booting",
  "downloading_model",
  "starting_server",
  "ready",
  "degraded",
];

// A pod is billing whenever it exists on the provider (coming up or serving), not when terminal.
export function isBilling(state: DeploymentState): boolean {
  return BILLING.includes(state);
}
