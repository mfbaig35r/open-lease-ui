"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { useAvailability, useDeploy, useModels, useProviders } from "@/lib/hooks";
import type { DeployBody } from "@/lib/types";

type Mode = "catalog" | "adhoc";
const PROVIDER = "runpod";

export function DeployForm() {
  const router = useRouter();
  const models = useModels();
  const providers = useProviders();
  const deploy = useDeploy();

  const [mode, setMode] = useState<Mode>("catalog");
  const [modelId, setModelId] = useState("");
  const [hfRepo, setHfRepo] = useState("");
  const [gpu, setGpu] = useState("");
  const [context, setContext] = useState("");
  const [advanced, setAdvanced] = useState(false);

  const gpuTypes = providers.data?.find((p) => p.name === PROVIDER)?.gpu_types ?? [];
  // /models returns ModelSpec (no profile), so we do not know a catalog model's recommended GPU
  // client-side. For catalog the GPU is an optional override; the backend applies the recommended
  // default when it is omitted. For ad-hoc it is required.
  const effectiveGpu = gpu;
  const rate = gpuTypes.find((g) => g.id === effectiveGpu)?.hourly_usd;

  const avail = useAvailability(effectiveGpu ? { gpu: effectiveGpu } : {});
  const openDcs = useMemo(
    () => (avail.data ?? []).filter((a) => a.available).map((a) => a.data_center_id),
    [avail.data],
  );

  const valid = mode === "catalog" ? !!modelId : !!hfRepo && !!effectiveGpu;

  const onSubmit = () => {
    const body: DeployBody =
      mode === "catalog"
        ? { model_id: modelId, provider: PROVIDER, gpu: gpu || undefined, wait: false }
        : {
            hf_repo: hfRepo.trim(),
            gpu: effectiveGpu,
            provider: PROVIDER,
            context: context ? Number(context) : undefined,
            wait: false,
          };
    deploy.mutate(body, { onSuccess: (dep) => router.push(`/deployment?id=${dep.id}`) });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Deploy" sub="A catalog model, or any vLLM-servable Hugging Face repo." />

      <div className="space-y-5">
        <Segmented mode={mode} onChange={setMode} />

        {mode === "catalog" ? (
          <Field label="Model">
            <Select value={modelId} onChange={setModelId} placeholder="Select a catalog model">
              {(models.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} · {m.parameter_count} · {m.context_window} ctx
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Hugging Face repo">
            <input
              value={hfRepo}
              onChange={(e) => setHfRepo(e.target.value)}
              placeholder="e.g. Qwen/Qwen3-14B"
              className="ol-control"
            />
          </Field>
        )}

        <Field
          label="GPU"
          hint={mode === "catalog" ? "defaults to the model's recommended GPU" : "required"}
        >
          <Select value={effectiveGpu} onChange={setGpu} placeholder="Select a GPU">
            {gpuTypes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.id} · {g.memory_gb}GB · {formatUSD(g.hourly_usd)}/hr
              </option>
            ))}
          </Select>
        </Field>

        {mode === "adhoc" && (
          <div>
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className="ol-label transition-colors hover:text-ink"
            >
              {advanced ? "− advanced" : "+ advanced"}
            </button>
            {advanced && (
              <div className="mt-3">
                <Field label="Context length" hint="omit to let vLLM auto-detect">
                  <input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. 32768"
                    className="ol-control"
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {/* Capacity + rate */}
        {effectiveGpu && (
          <div className="rounded-lg border border-rule bg-surface p-4 text-small">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Rate</span>
              <span className="font-mono tabular-nums text-ink-strong">
                {rate != null ? `${formatUSD(rate)}/hr` : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-muted">Capacity now</span>
              <span
                className={cn(
                  "font-mono",
                  avail.isLoading
                    ? "text-ink-muted"
                    : openDcs.length
                      ? "text-accent"
                      : "text-warn",
                )}
              >
                {avail.isLoading
                  ? "checking…"
                  : openDcs.length
                    ? `${openDcs.length} data center${openDcs.length === 1 ? "" : "s"}`
                    : "none available (deploy may wait)"}
              </span>
            </div>
          </div>
        )}

        {deploy.isError && (
          <p className="text-small text-danger">{(deploy.error as Error).message}</p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            disabled={!valid || deploy.isPending}
            onClick={onSubmit}
            className="ol-btn"
          >
            {deploy.isPending ? "Deploying…" : "Deploy"}
          </button>
          <p className="font-mono text-label text-ink-muted">
            non-blocking; a daemon drives it (run <span className="text-accent-soft">gpu up</span>)
          </p>
        </div>
      </div>
    </div>
  );
}

function Segmented({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const opts: { id: Mode; label: string }[] = [
    { id: "catalog", label: "Catalog model" },
    { id: "adhoc", label: "Any HF model" },
  ];
  return (
    <div className="inline-flex rounded-md border border-rule p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex h-8 items-center rounded px-3 text-small transition-colors",
            mode === o.id ? "bg-surface text-ink-strong" : "text-ink-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="ol-label">{label}</span>
        {hint && <span className="font-mono text-label text-ink-muted">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="ol-control">
      <option value="" disabled>
        {placeholder}
      </option>
      {children}
    </select>
  );
}
