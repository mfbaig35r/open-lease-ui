import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { CostRecord } from "./types";

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
