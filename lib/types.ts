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

// --- capacity envelope (open-lease plan tiers A + B) ---------------------------------

export type Posture = "on" | "off";

/** One window of a schedule. `days` is 0 (Mon) through 6 (Sun); `start` later than `end` wraps past
 *  midnight. Times are wall-clock "HH:MM" in the schedule's own timezone. */
export interface ScheduleRule {
  days: number[];
  start: string;
  end: string;
  posture: Posture;
}

export interface Schedule {
  timezone: string;
  default_posture: Posture;
  rules: ScheduleRule[];
}

export type BudgetWindow = "daily" | "monthly";
export type BudgetAction = "warn" | "stop" | "block_new";

export interface Budget {
  id: string;
  deployment_id: string | null; // null = account-wide
  window: BudgetWindow;
  limit_usd: number;
  on_exceed: BudgetAction;
  warn_fraction: number;
}

/** A budget plus what it has spent so far this window (`GET /budgets`). */
export interface BudgetStatus {
  budget: Budget;
  spent_usd: number;
  fraction: number;
  over_warn: boolean;
  exceeded: boolean;
}

export interface AutoscalePolicy {
  model_id: string;
  min_replicas: number;
  max_replicas: number;
  target_rpm_per_replica: number;
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
  state_history: StateTransition[];
  // Capacity envelope. `schedule` null is manual control; `budget_hold` is a deployment torn down by
  // a budget ceiling (it explains an otherwise mysterious stop); `max_concurrency` null is unlimited.
  schedule: Schedule | null;
  budget_hold: boolean;
  max_concurrency: number | null;
  max_queue: number;
  queue_timeout_s: number;
  created_at: string;
  updated_at: string;
}

export interface StateTransition {
  from_state: DeploymentState;
  to_state: DeploymentState;
  at: string;
  reason: string;
}

export type HealthState = "healthy" | "degraded" | "failed" | "booting";

export interface CheckResult {
  ok: boolean;
  latency_ms: number | null;
  detail: string;
}

export interface HealthStatus {
  status: HealthState;
  checks: Record<string, CheckResult>;
  checked_at: string;
}

export type EventKind =
  | "deployment_requested"
  | "instance_created"
  | "image_pulled"
  | "model_download_started"
  | "model_download_completed"
  | "server_started"
  | "health_passed"
  | "deployment_ready"
  | "health_degraded"
  | "deployment_stopped"
  | "deployment_deleted"
  | "deployment_failed"
  | "reconcile_action"
  | "instance_adopted"
  | "orphan_detected"
  | "orphan_destroyed"
  | "cost_snapshot"
  | "budget_warning"
  | "budget_exceeded"
  | "budget_released"
  | "autoscaled";

export interface Event {
  id: string;
  at: string;
  correlation_id: string;
  deployment_id: string | null;
  kind: EventKind;
  payload: Record<string, unknown>;
}

export interface CostRecord {
  deployment_id: string;
  gpu_hourly_usd: number;
  started_at: string;
  stopped_at: string | null;
  accrued_usd: number;
}

export interface UsageSummary {
  deployment_id: string;
  model_id: string;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  accrued_usd: number;
  uptime_seconds: number;
  // computed by the API and serialized
  total_tokens: number;
  tokens_per_sec: number;
  cost_per_mtok: number | null;
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

export interface GpuType {
  id: string;
  name: string;
  memory_gb: number;
  hourly_usd: number;
}

export interface ProviderInfo {
  name: string;
  gpu_types: GpuType[];
}

export interface GpuAvailability {
  data_center_id: string;
  gpu_type_id: string;
  available: boolean;
  stock_status: string | null;
}

export interface DeployBody {
  model_id?: string;
  hf_repo?: string;
  provider?: string;
  gpu?: string;
  context?: number;
  image?: string;
  disk?: number;
  wait?: boolean;
}

// Request bodies for the capacity routes. Schedules post the domain model itself; the rest mirror
// the API's small DTOs (their Orchestrator methods take keyword arguments, not one model).

export interface LimitsBody {
  max_concurrency: number;
  max_queue?: number;
  queue_timeout_s?: number;
}

export interface ScaleBody {
  model_id: string;
  replicas: number;
  wait?: boolean;
}

export interface BudgetBody {
  limit_usd: number;
  window?: BudgetWindow;
  on_exceed?: BudgetAction;
  deployment_id?: string | null;
  warn_fraction?: number;
}

export interface AutoscaleBody {
  max_replicas: number;
  target_rpm_per_replica: number;
  min_replicas?: number;
}
