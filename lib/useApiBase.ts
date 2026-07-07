"use client";

import { useConn } from "./connection";

// The base a client would call: the connected server, or the current origin when embedded.
export function useApiBase(): string {
  const { baseUrl } = useConn();
  if (baseUrl) return baseUrl.replace(/\/$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}
