import { ConnectionGate } from "./ConnectionGate";
import { GpuIcon } from "./GpuIcon";
import { Nav } from "./Nav";
import { SidebarConnection } from "./SidebarConnection";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-rule px-4 py-6">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <GpuIcon className="h-5 w-5 text-accent-soft" />
          <div className="leading-none">
            <p className="font-mono text-label tracking-[0.04em] text-ink-strong uppercase">
              OpenLease
            </p>
            <p className="mt-1 font-mono text-label tracking-[0.04em] text-ink-muted uppercase">
              Workbench
            </p>
          </div>
        </div>
        <Nav />
        <div className="mt-auto">
          <SidebarConnection />
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1200px]">
          <ConnectionGate>{children}</ConnectionGate>
        </div>
      </main>
    </div>
  );
}
