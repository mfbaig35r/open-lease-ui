"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// The page's own origin (where the workbench is hosted) — used in the `gpu serve --cors-origin`
// hint. Hydration-safe: empty on the server snapshot, real on the client.
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
