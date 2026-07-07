import { useSyncExternalStore } from "react";
import { API_URL } from "./api";

// The base a client would call. When the UI is served by `gpu serve` (embedded), API_URL is empty
// and the workbench origin *is* the proxy, so use window.location.origin. useSyncExternalStore keeps
// server/hydration snapshots consistent (no hydration mismatch, no set-state-in-effect).
const subscribe = () => () => {};

export function useApiBase(): string {
  return useSyncExternalStore(
    subscribe,
    () => (API_URL || window.location.origin).replace(/\/$/, ""),
    () => API_URL,
  );
}
