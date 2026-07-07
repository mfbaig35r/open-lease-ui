import { cn } from "@/lib/cn";
import { STATE, TONE_BG, TONE_TEXT } from "@/lib/state";
import type { DeploymentState } from "@/lib/types";

export function StateBadge({ state }: { state: DeploymentState }) {
  const meta = STATE[state];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-label tracking-[0.04em] uppercase">
      <span
        className={cn("h-1.5 w-1.5 rounded-full", TONE_BG[meta.tone], meta.comingUp && "ol-pulse")}
      />
      <span className={TONE_TEXT[meta.tone]}>{meta.label}</span>
    </span>
  );
}
