"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Deployment } from "@/lib/types";
import { useApiBase } from "@/lib/useApiBase";
import { CopyButton } from "../CopyButton";

type Lang = "curl" | "python" | "js";
const TABS: { id: Lang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
  { id: "js", label: "JavaScript" },
];

function snippet(lang: Lang, base: string, model: string): string {
  const v1 = `${base}/v1`;
  if (lang === "curl")
    return `curl ${v1}/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;
  if (lang === "python")
    return `from openai import OpenAI

client = OpenAI(base_url="${v1}", api_key="EMPTY")
resp = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello"}],
)
print(resp.choices[0].message.content)`;
  return `const res = await fetch("${v1}/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "${model}",
    messages: [{ role: "user", content: "Hello" }],
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="ol-label">{label}</span>
        <CopyButton value={value} />
      </div>
      <p className="mt-1 truncate font-mono text-small text-ink-strong">{value}</p>
    </div>
  );
}

export function EndpointDocs({ dep, serving }: { dep: Deployment; serving: boolean }) {
  const base = useApiBase();
  const [lang, setLang] = useState<Lang>("curl");
  const v1 = `${base}/v1`;
  const model = dep.model_id;
  const code = snippet(lang, base, model);

  return (
    <section className="mb-6 rounded-lg border border-rule bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <span className="ol-label">API</span>
        {serving && (
          <span className="ol-label inline-flex items-center gap-1.5 text-accent-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-accent ol-pulse" />
            live
          </span>
        )}
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Base URL" value={v1} />
          <Row label="Model" value={model} />
        </div>

        <div>
          <div className="mb-2 inline-flex rounded-md border border-rule p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLang(t.id)}
                className={cn(
                  "flex h-7 items-center rounded px-2.5 text-label transition-colors",
                  lang === t.id ? "bg-surface-raised text-ink-strong" : "text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre
              className="overflow-auto rounded-md bg-canvas p-3 pr-16 font-mono text-label leading-relaxed text-ink"
              style={{ fontFeatureSettings: '"liga" 0, "calt" 0' }}
            >
              {code}
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton value={code} />
            </div>
          </div>
        </div>

        <p className="font-mono text-label text-ink-muted">
          OpenAI-compatible, routed through the OpenLease proxy. No auth by default; if you set an API
          token, add <span className="text-accent-soft">Authorization: Bearer &lt;token&gt;</span>.
        </p>

        {dep.endpoint_url && (
          <p className="truncate border-t border-rule pt-3 font-mono text-label text-ink-muted">
            Direct pod endpoint (model = HF repo id):{" "}
            <span className="text-ink">{dep.endpoint_url.replace(/\/$/, "")}/v1</span>
          </p>
        )}
      </div>
    </section>
  );
}
