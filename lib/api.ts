// Typed client for the open-lease REST API. Talks HTTP only; no core imports (Phase 4 boundary).
import type {
  CostRecord,
  Deployment,
  Event,
  HealthStatus,
  ModelSpec,
  ProviderInfo,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : undefined,
      cache: "no-store",
    });
  } catch {
    // Network-level failure: the API is not reachable (gpu serve not running, wrong URL).
    throw new ApiError(`cannot reach the API at ${API_URL}`, 0);
  }
  if (!res.ok) {
    // The API returns { error: "<one sentence>" } on non-2xx; surface it verbatim.
    const sentence = await res
      .json()
      .then((b) => b?.error as string | undefined)
      .catch(() => undefined);
    throw new ApiError(sentence ?? `request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

async function send<T>(method: "POST" | "DELETE", path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : undefined,
    });
  } catch {
    throw new ApiError(`cannot reach the API at ${API_URL}`, 0);
  }
  if (!res.ok) {
    const sentence = await res
      .json()
      .then((b) => b?.error as string | undefined)
      .catch(() => undefined);
    throw new ApiError(sentence ?? `request failed (${res.status})`, res.status);
  }
  return res.status === 204 ? null : (res.json() as Promise<T>);
}

export const api = {
  listDeployments: (includeStopped = false) =>
    get<Deployment[]>(`/deployments?include_stopped=${includeStopped}`),
  getDeployment: (id: string) => get<Deployment>(`/deployments/${id}`),
  events: (id: string) => get<Event[]>(`/deployments/${id}/events`),
  logs: (id: string, tail = 200) => get<string[]>(`/deployments/${id}/logs?tail=${tail}`),
  health: (id: string) => get<HealthStatus>(`/deployments/${id}/health`),
  costs: () => get<CostRecord[]>(`/costs`),
  models: () => get<ModelSpec[]>(`/models`),
  providers: () => get<ProviderInfo[]>(`/providers`),
  stop: (id: string) => send<Deployment>("POST", `/deployments/${id}/stop`),
  restart: (id: string) => send<Deployment>("POST", `/deployments/${id}/restart`),
  delete: (id: string) => send<null>("DELETE", `/deployments/${id}`),
};
