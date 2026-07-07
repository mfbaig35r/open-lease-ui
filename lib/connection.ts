"use client";

// Runtime connection config: which open-lease server the workbench talks to, and the token for it.
// Persisted to localStorage so a hosted workbench (openlease.canonicalresearch.dev/workbench)
// remembers your local server. Embedded `gpu ui` is same-origin and never prompts.
//
// A hand-rolled store over useSyncExternalStore keeps server/hydration snapshots consistent (no
// hydration mismatch) without pulling in a state library.

import { useSyncExternalStore } from "react";

export type ConnStatus = "unknown" | "connecting" | "connected" | "error";

export interface Conn {
  baseUrl: string;
  token: string;
  status: ConnStatus;
  error: string | null;
}

// Hosted build (served from canonicalresearch.dev) shows the connect gate; embedded/dev does not.
export const HOSTED = process.env.NEXT_PUBLIC_WORKBENCH_HOSTED === "1";

// "" (embedded build) -> same-origin. undefined (dev) -> localhost default. A URL -> that.
const RAW = process.env.NEXT_PUBLIC_API_URL;
const BUILD_URL = RAW === undefined ? "http://localhost:8000" : RAW.replace(/\/$/, "");
const BUILD_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "";

const LS_URL = "ol.baseUrl";
const LS_TOKEN = "ol.token";

function defaultBaseUrl(): string {
  if (BUILD_URL) return BUILD_URL; // explicit dev URL
  if (HOSTED) return ""; // hosted: the user must connect to their own server
  return typeof window !== "undefined" ? window.location.origin : ""; // embedded: same-origin
}

// Build/SSR snapshot. Embedded/dev starts "connected" (the same-origin API is assumed present, and a
// bad guess just surfaces as a failed query); hosted starts "unknown" until the gate connects.
const serverState: Conn = {
  baseUrl: BUILD_URL,
  token: BUILD_TOKEN,
  status: HOSTED ? "unknown" : "connected",
  error: null,
};

let state: Conn = serverState;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const savedUrl = localStorage.getItem(LS_URL);
  const savedToken = localStorage.getItem(LS_TOKEN);
  state = {
    ...state,
    baseUrl: savedUrl ?? defaultBaseUrl(),
    token: savedToken ?? BUILD_TOKEN,
  };
}

function emit(): void {
  for (const l of listeners) l();
}

export function getConn(): Conn {
  hydrate();
  return state;
}

export function setConn(patch: Partial<Conn>): void {
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    if (patch.baseUrl !== undefined) localStorage.setItem(LS_URL, patch.baseUrl);
    if (patch.token !== undefined) localStorage.setItem(LS_TOKEN, patch.token);
  }
  emit();
}

export function useConn(): Conn {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      hydrate();
      return state;
    },
    () => serverState,
  );
}

/** Health-check the configured server (GET /models with the token) and set the status. */
export async function connect(): Promise<void> {
  const { baseUrl, token } = getConn();
  const base = baseUrl.replace(/\/$/, "");
  setConn({ status: "connecting", error: null });
  try {
    const res = await fetch(`${base}/models`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (res.status === 401) {
      setConn({ status: "error", error: "unauthorized — check the API token" });
      return;
    }
    if (!res.ok) {
      setConn({ status: "error", error: `server responded ${res.status}` });
      return;
    }
    setConn({ status: "connected", error: null });
  } catch {
    setConn({ status: "error", error: `cannot reach ${base || "the server"}` });
  }
}

export function disconnect(): void {
  setConn({ status: "unknown", error: null });
}
