"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { connect, HOSTED, useConn } from "@/lib/connection";
import { useOrigin } from "@/lib/useOrigin";
import { ConfigPanel } from "./ConfigPanel";
import { CopyButton } from "./CopyButton";

// In the hosted build, hold the app behind a connect screen until a local server answers. Embedded
// `gpu ui` is same-origin, so this is a pass-through there.
export function ConnectionGate({ children }: { children: React.ReactNode }) {
  const { status, baseUrl } = useConn();
  const pathname = usePathname();
  const tried = useRef(false);

  // If a server URL was remembered from a previous visit, try it once on load.
  useEffect(() => {
    if (HOSTED && !tried.current && status === "unknown" && baseUrl.trim()) {
      tried.current = true;
      connect();
    }
  }, [status, baseUrl]);

  // Docs explain how to connect, so they stay readable before a connection exists.
  const alwaysOpen = pathname?.startsWith("/docs") ?? false;
  if (!HOSTED || status === "connected" || alwaysOpen) return <>{children}</>;
  return <ConnectScreen />;
}

function ConnectScreen() {
  const origin = useOrigin();
  const cmd = `gpu serve --cors-origin ${origin || "https://<this-page-origin>"}`;
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-16">
      <h1 className="text-h1 text-ink-strong">Connect your server</h1>
      <p className="mt-2 text-body text-ink-muted">
        The workbench drives a local open-lease server in your browser. Start it with this page
        allowed as a cross-origin caller, then connect below. Your server URL and token stay in this
        browser and are sent only to your machine.
      </p>

      <div className="mt-6 rounded-lg border border-rule bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="ol-label">Run locally</span>
          <CopyButton value={cmd} />
        </div>
        <pre
          className="mt-2 overflow-auto rounded-md bg-canvas p-3 font-mono text-label text-ink"
          style={{ fontFeatureSettings: '"liga" 0, "calt" 0' }}
        >
          {cmd}
        </pre>
        <p className="mt-2 font-mono text-label text-ink-muted">
          Requires the API extra: <span className="text-accent-soft">pip install &apos;open-lease[api]&apos;</span>
        </p>
      </div>

      <div className="mt-4">
        <ConfigPanel defaultOpen />
      </div>
    </div>
  );
}
