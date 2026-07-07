import type { Tone } from "./state";
import type { Event, EventKind } from "./types";

export const EVENT_META: Record<EventKind, { label: string; tone: Tone }> = {
  deployment_requested: { label: "Requested", tone: "muted" },
  instance_created: { label: "Instance created", tone: "warn" },
  image_pulled: { label: "Image pulled", tone: "muted" },
  model_download_started: { label: "Download started", tone: "warn" },
  model_download_completed: { label: "Download complete", tone: "warn" },
  server_started: { label: "Server started", tone: "warn" },
  health_passed: { label: "Health passed", tone: "accent" },
  deployment_ready: { label: "Ready", tone: "accent" },
  health_degraded: { label: "Degraded", tone: "danger" },
  deployment_stopped: { label: "Stopped", tone: "muted" },
  deployment_deleted: { label: "Deleted", tone: "muted" },
  deployment_failed: { label: "Failed", tone: "danger" },
  reconcile_action: { label: "Reconcile", tone: "muted" },
  instance_adopted: { label: "Instance adopted", tone: "accent" },
  orphan_detected: { label: "Orphan detected", tone: "danger" },
  orphan_destroyed: { label: "Orphan reaped", tone: "danger" },
  cost_snapshot: { label: "Cost snapshot", tone: "muted" },
};

// A short human summary from the event payload (the interesting bits: the reconcile action, the
// error, the runtime-death count) so the feed reads as a story, not raw JSON.
export function eventDetail(e: Event): string {
  const p = e.payload ?? {};
  if (typeof p.action === "string") {
    const rf = typeof p.runtime_failures === "number" ? ` (${p.runtime_failures})` : "";
    return String(p.action).replace(/_/g, " ") + rf;
  }
  if (typeof p.error === "string") return p.error;
  if (typeof p.instance === "string") return p.instance;
  return "";
}
