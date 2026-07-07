import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { STATE, TONE_BG, TONE_TEXT } from "@/lib/state";
import type { StateTransition } from "@/lib/types";
import { Panel } from "./Panel";

export function StateTimeline({ history, now }: { history: StateTransition[]; now: number }) {
  const items = [...history].reverse(); // newest first

  return (
    <Panel title="State timeline">
      {items.length === 0 ? (
        <p className="font-mono text-small text-ink-muted">no transitions yet</p>
      ) : (
        <ol className="space-y-3">
          {items.map((t, i) => {
            const meta = STATE[t.to_state];
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TONE_BG[meta.tone])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn("text-small", TONE_TEXT[meta.tone])}>{meta.label}</span>
                    <span className="shrink-0 font-mono text-label tabular-nums text-ink-muted">
                      {relativeTime(t.at, now)}
                    </span>
                  </div>
                  {t.reason && (
                    <p className="truncate font-mono text-label text-ink-muted">{t.reason}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
