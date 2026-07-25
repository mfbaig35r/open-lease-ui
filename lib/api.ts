// Typed client for the open-lease REST API. Talks HTTP only; no core imports (Phase 4 boundary).
// Base URL + token are read from the runtime connection store per call, so a hosted workbench can
// point at whichever local server the user connected to.
import { getConn } from "./connection";
import type {
  AutoscaleBody,
  AutoscalePolicy,
  Budget,
  BudgetBody,
  BudgetStatus,
  CostRecord,
  Deployment,
  DeployBody,
  Event,
  GpuAvailability,
  HealthStatus,
  LimitsBody,
  ModelSpec,
  ProviderInfo,
  ScaleBody,
  Schedule,
  UsageSummary,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function base(): string {
  return getConn().baseUrl.replace(/\/$/, "");
}

function authHeaders(extra?: Record<string, string>): Record<string, string> | undefined {
  const { token } = getConn();
  const headers = { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  return Object.keys(headers).length ? headers : undefined;
}

async function unwrap<T>(res: Response): Promise<T> {
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

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { headers: authHeaders(), cache: "no-store" });
  } catch {
    // Network-level failure: the API is not reachable (gpu serve not running, wrong URL, no CORS).
    throw new ApiError(`cannot reach the API at ${base() || "the configured server"}`, 0);
  }
  return unwrap<T>(res);
}

async function send<T>(method: "POST" | "DELETE", path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { method, headers: authHeaders() });
  } catch {
    throw new ApiError(`cannot reach the API at ${base() || "the configured server"}`, 0);
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

async function withJson<T>(method: "POST" | "PUT", path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      method,
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`cannot reach the API at ${base() || "the configured server"}`, 0);
  }
  return unwrap<T>(res);
}

const postJson = <T>(path: string, body: unknown) => withJson<T>("POST", path, body);
const putJson = <T>(path: string, body: unknown) => withJson<T>("PUT", path, body);

export const api = {
  listDeployments: (includeStopped = false) =>
    get<Deployment[]>(`/deployments?include_stopped=${includeStopped}`),
  getDeployment: (id: string) => get<Deployment>(`/deployments/${id}`),
  events: (id: string) => get<Event[]>(`/deployments/${id}/events`),
  logs: (id: string, tail = 200) => get<string[]>(`/deployments/${id}/logs?tail=${tail}`),
  health: (id: string) => get<HealthStatus>(`/deployments/${id}/health`),
  costs: () => get<CostRecord[]>(`/costs`),
  usage: () => get<UsageSummary[]>(`/usage`),
  models: () => get<ModelSpec[]>(`/models`),
  providers: () => get<ProviderInfo[]>(`/providers`),
  availability: (params: { model_id?: string; gpu?: string }) => {
    const q = new URLSearchParams();
    if (params.model_id) q.set("model_id", params.model_id);
    if (params.gpu) q.set("gpu", params.gpu);
    return get<GpuAvailability[]>(`/availability?${q.toString()}`);
  },
  deploy: (body: DeployBody) => postJson<Deployment>(`/deployments`, body),
  stop: (id: string) => send<Deployment>("POST", `/deployments/${id}/stop`),
  restart: (id: string) => send<Deployment>("POST", `/deployments/${id}/restart`),
  delete: (id: string) => send<null>("DELETE", `/deployments/${id}`),

  // Capacity envelope. Schedules and limits belong to one deployment; budgets, autoscaling, and
  // replica count are account- or model-scoped, so they are their own resources.
  setSchedule: (id: string, body: Schedule) =>
    putJson<Deployment>(`/deployments/${id}/schedule`, body),
  clearSchedule: (id: string) => send<Deployment>("DELETE", `/deployments/${id}/schedule`),
  setLimits: (id: string, body: LimitsBody) => putJson<Deployment>(`/deployments/${id}/limits`, body),
  clearLimits: (id: string) => send<Deployment>("DELETE", `/deployments/${id}/limits`),
  scale: (body: ScaleBody) => postJson<Deployment[]>(`/scale`, body),
  budgets: () => get<BudgetStatus[]>(`/budgets`),
  createBudget: (body: BudgetBody) => postJson<Budget>(`/budgets`, body),
  removeBudget: (budgetId: string) => send<null>("DELETE", `/budgets/${budgetId}`),
  autoscale: () => get<AutoscalePolicy[]>(`/autoscale`),
  setAutoscale: (modelId: string, body: AutoscaleBody) =>
    putJson<AutoscalePolicy>(`/autoscale/${modelId}`, body),
  removeAutoscale: (modelId: string) => send<null>("DELETE", `/autoscale/${modelId}`),
};
