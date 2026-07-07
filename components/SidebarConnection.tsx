"use client";

import { HOSTED, useConn } from "@/lib/connection";
import { ConfigPanel } from "./ConfigPanel";

// Once connected in the hosted build, keep a compact status + disconnect control in the sidebar.
// Hidden entirely when embedded (same-origin) or while the connect gate is showing.
export function SidebarConnection() {
  const { status } = useConn();
  if (!HOSTED || status !== "connected") return null;
  return (
    <div className="mt-8">
      <ConfigPanel />
    </div>
  );
}
