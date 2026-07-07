"use client";

import { useState } from "react";
import { connect, disconnect, setConn, useConn } from "@/lib/connection";
import { ConnectionStatusDot } from "./ConnectionStatusDot";

// The connect form: server URL + token, with a health-checked Connect/Disconnect. Used in the gate
// screen (disconnected) and the sidebar (connected). Inputs lock while connected.
export function ConfigPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { baseUrl, token, status, error } = useConn();
  const [open, setOpen] = useState(defaultOpen);
  const connected = status === "connected";

  return (
    <div className="rounded-lg border border-rule bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <ConnectionStatusDot status={status} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ol-label transition-colors hover:text-ink"
        >
          {open ? "hide" : "settings"}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-rule p-3">
          <label className="block">
            <span className="ol-label">Server URL</span>
            <input
              className="ol-control mt-1.5"
              value={baseUrl}
              onChange={(e) => setConn({ baseUrl: e.target.value })}
              placeholder="http://localhost:8000"
              disabled={connected}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <label className="block">
            <span className="ol-label">API token</span>
            <input
              type="password"
              className="ol-control mt-1.5"
              value={token}
              onChange={(e) => setConn({ token: e.target.value })}
              placeholder="optional"
              disabled={connected}
            />
          </label>
          {error && <p className="text-small text-danger">{error}</p>}
          {connected ? (
            <button type="button" onClick={disconnect} className="ol-btn ol-btn-ghost w-full">
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              disabled={status === "connecting" || !baseUrl.trim()}
              className="ol-btn w-full"
            >
              {status === "connecting" ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
