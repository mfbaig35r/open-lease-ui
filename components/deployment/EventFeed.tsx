"use client";

import { cn } from "@/lib/cn";
import { EVENT_META, eventDetail } from "@/lib/events";
import { relativeTime } from "@/lib/format";
import { useEvents } from "@/lib/hooks";
import { TONE_BG, TONE_TEXT } from "@/lib/state";
import { useNow } from "@/lib/useNow";
import { Panel } from "./Panel";

export function EventFeed({ id }: { id: string }) {
  const { data, isError } = useEvents(id);
  const now = useNow(true);
  const events = data ? [...data].reverse() : []; // newest first

  return (
    <Panel title="Events">
      {isError ? (
        <p className="font-mono text-small text-ink-muted">unavailable</p>
      ) : events.length === 0 ? (
        <p className="font-mono text-small text-ink-muted">no events yet</p>
      ) : (
        <ol className="max-h-[460px] space-y-2.5 overflow-auto">
          {events.map((e) => {
            const meta = EVENT_META[e.kind] ?? { label: e.kind, tone: "muted" as const };
            const detail = eventDetail(e);
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span
                  className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TONE_BG[meta.tone])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn("text-small", TONE_TEXT[meta.tone])}>{meta.label}</span>
                    <span className="shrink-0 font-mono text-label tabular-nums text-ink-muted">
                      {relativeTime(e.at, now)}
                    </span>
                  </div>
                  {detail && (
                    <p className="truncate font-mono text-label text-ink-muted">{detail}</p>
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
