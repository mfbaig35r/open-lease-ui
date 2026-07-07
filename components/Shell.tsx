import { cn } from "@/lib/cn";
import { GpuIcon } from "./GpuIcon";

// Slice 1 ships the Overview; the rest of the workbench is scaffolded here so the frame is set.
const NAV = [
  { label: "Overview", active: true },
  { label: "Deployments", active: false },
  { label: "Deploy", active: false },
  { label: "Playground", active: false },
  { label: "Costs", active: false },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r border-rule px-4 py-6">
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
        <nav className="space-y-1">
          {NAV.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between rounded-sm px-2 py-1.5 text-small",
                item.active
                  ? "bg-surface text-ink-strong"
                  : "text-ink-muted",
              )}
            >
              <span>{item.label}</span>
              {!item.active && (
                <span className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase opacity-60">
                  soon
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
