// Domain types mirroring the open-lease REST API (Pydantic models, spec section 6).
// Hand-written for now; could be generated from /openapi.json later.

export type DeploymentState =
  | "requested"
  | "provisioning"
  | "booting"
  | "downloading_model"
  | "starting_server"
  | "ready"
  | "degraded"
  | "stopping"
  | "stopped"
  | "failed";

export interface Instance {
  provider_instance_id: string;
  provider: string;
  gpu_type: string;
  state: string;
  public_url: string | null;
  ports: number[];
}

export interface RuntimeProfile {
  model_id: string;
  runtime: string;
  image: string;
  recommended_gpu: string;
  min_disk_gb: number;
  tensor_parallel: number;
  gpu_memory_utilization: number;
  launch_args: Record<string, string>;
}

export interface FailureInfo {
  stage: DeploymentState;
  message: string;
  retryable: boolean;
  attempts: number;
}

export interface Deployment {
  id: string;
  model_id: string;
  provider: string;
  hf_repo: string;
  context_window: number;
  desired_state: DeploymentState;
  observed_state: DeploymentState;
  profile: RuntimeProfile;
  instance: Instance | null;
  endpoint_url: string | null;
  download_progress: number | null;
  failure: FailureInfo | null;
  runtime_failures: number;
  created_at: string;
  updated_at: string;
}

export interface CostRecord {
  deployment_id: string;
  gpu_hourly_usd: number;
  started_at: string;
  stopped_at: string | null;
  accrued_usd: number;
}

export interface ModelSpec {
  id: string;
  hf_repo: string;
  family: string;
  parameter_count: string;
  min_gpu_memory_gb: number;
  context_window: number;
  license: string;
}

export interface ProviderInfo {
  name: string;
  gpu_types: { id: string; name: string; memory_gb: number; hourly_usd: number }[];
}
