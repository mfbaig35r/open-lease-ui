import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  AutoscaleBody,
  BudgetBody,
  CostRecord,
  DeployBody,
  LimitsBody,
  Schedule,
} from "./types";

// The store is the source of truth and the daemon writes to it, so polling reflects reality within
// a tick. ~1s on the deployment list keeps the Overview feeling live; costs update a little slower.
export function useDeployments(includeStopped = false) {
  return useQuery({
    queryKey: ["deployments", includeStopped],
    queryFn: () => api.listDeployments(includeStopped),
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
  });
}

export function useCosts() {
  return useQuery({
    queryKey: ["costs"],
    queryFn: () => api.costs(),
    refetchInterval: 3000,
    // Index by deployment id so a card can look up its rate + start for the live meter.
    select: (rows) => new Map(rows.map((r) => [r.deployment_id, r] as const)),
  });
}

export type CostIndex = Map<string, CostRecord>;

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: () => api.usage(),
    refetchInterval: 3000,
  });
}

export function useDeployment(id: string) {
  return useQuery({
    queryKey: ["deployment", id],
    queryFn: () => api.getDeployment(id),
    refetchInterval: 1000,
    enabled: !!id,
  });
}

export function useEvents(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => api.events(id),
    refetchInterval: 2000,
    enabled: !!id,
  });
}

export function useLogs(id: string) {
  return useQuery({
    queryKey: ["logs", id],
    queryFn: () => api.logs(id),
    refetchInterval: 3000,
    enabled: !!id,
  });
}

export function useHealth(id: string) {
  return useQuery({
    queryKey: ["health", id],
    queryFn: () => api.health(id),
    refetchInterval: 5000,
    enabled: !!id,
  });
}

export function useModels() {
  return useQuery({ queryKey: ["models"], queryFn: () => api.models(), staleTime: 60_000 });
}

export function useProviders() {
  return useQuery({ queryKey: ["providers"], queryFn: () => api.providers(), staleTime: 60_000 });
}

export function useAvailability(params: { model_id?: string; gpu?: string }) {
  return useQuery({
    queryKey: ["availability", params.model_id ?? "", params.gpu ?? ""],
    queryFn: () => api.availability(params),
    enabled: !!(params.model_id || params.gpu),
    refetchInterval: 10_000,
  });
}

export function useDeploy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeployBody) => api.deploy(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });
}

// Stop / restart / delete for one deployment, invalidating the reads that change on success.
export function useDeploymentActions(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["deployment", id] });
    qc.invalidateQueries({ queryKey: ["deployments"] });
    qc.invalidateQueries({ queryKey: ["events", id] });
  };
  return {
    stop: useMutation({ mutationFn: () => api.stop(id), onSuccess: refresh }),
    restart: useMutation({ mutationFn: () => api.restart(id), onSuccess: refresh }),
    remove: useMutation({
      mutationFn: () => api.delete(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
    }),
  };
}

// --- capacity envelope ---------------------------------------------------------------
// A policy write changes what the daemon does on its next tick, not the store's shape, so these
// invalidate the deployment reads and let the existing polling show the effect arriving.

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: () => api.budgets(), refetchInterval: 5000 });
}

export function useAutoscale() {
  return useQuery({
    queryKey: ["autoscale"],
    queryFn: () => api.autoscale(),
    refetchInterval: 10_000,
  });
}

/** Schedule + concurrency-limit writes for one deployment. */
export function useCapacityActions(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["deployment", id] });
    qc.invalidateQueries({ queryKey: ["deployments"] });
  };
  return {
    setSchedule: useMutation({
      mutationFn: (body: Schedule) => api.setSchedule(id, body),
      onSuccess: refresh,
    }),
    clearSchedule: useMutation({ mutationFn: () => api.clearSchedule(id), onSuccess: refresh }),
    setLimits: useMutation({
      mutationFn: (body: LimitsBody) => api.setLimits(id, body),
      onSuccess: refresh,
    }),
    clearLimits: useMutation({ mutationFn: () => api.clearLimits(id), onSuccess: refresh }),
  };
}

export function useScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, replicas }: { modelId: string; replicas: number }) =>
      api.scale({ model_id: modelId, replicas }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });
}

export function useBudgetActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["budgets"] });
  return {
    create: useMutation({ mutationFn: (body: BudgetBody) => api.createBudget(body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.removeBudget(id), onSuccess: refresh }),
  };
}

export function useAutoscaleActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["autoscale"] });
  return {
    set: useMutation({
      mutationFn: ({ modelId, body }: { modelId: string; body: AutoscaleBody }) =>
        api.setAutoscale(modelId, body),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (modelId: string) => api.removeAutoscale(modelId), onSuccess: refresh }),
  };
}
