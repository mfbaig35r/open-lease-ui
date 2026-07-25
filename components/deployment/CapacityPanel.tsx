"use client";

// Schedule + concurrency limit for one deployment (open-lease plan tiers A1 and A3). Both are
// properties of a deployment, so they live on its detail page rather than in a separate console.
//
// The editor writes the common shape: one ON window on chosen days, off the rest of the time. A
// schedule set from the CLI can be richer (several windows, a default-on posture), and that is shown
// read-only instead of being flattened into something the user did not ask for.

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useCapacityActions } from "@/lib/hooks";
import {
  DAY_LABELS,
  WEEKDAYS,
  browserZone,
  buildSchedule,
  describeRule,
  postureAt,
  postureVerb,
  simpleWindow,
  windowError,
  zoneOptions,
} from "@/lib/schedule";
import { isBilling } from "@/lib/state";
import type { Deployment } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { Panel } from "./Panel";

export function CapacityPanel({ dep }: { dep: Deployment }) {
  return (
    <Panel title="Capacity">
      <div className="space-y-5">
        {dep.budget_hold && (
          <p className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 font-mono text-label text-danger">
            Held down by a budget ceiling for the rest of its window. A budget stop outranks a
            schedule, so this stays torn down until the window resets or the ceiling changes.
          </p>
        )}
        <SchedulePart dep={dep} />
        <div className="border-t border-rule" />
        <LimitsPart dep={dep} />
      </div>
    </Panel>
  );
}

// --- schedule -------------------------------------------------------------------------

function SchedulePart({ dep }: { dep: Deployment }) {
  const actions = useCapacityActions(dep.id);
  const [editing, setEditing] = useState(false);
  const now = useNow(true);

  const schedule = dep.schedule;
  const simple = schedule ? simpleWindow(schedule) : null;
  const posture = schedule ? postureAt(schedule, now) : null;
  // null when there is nothing to compare (no schedule, or an unresolvable timezone).
  const obeying =
    posture == null
      ? null
      : posture === "on"
        ? isBilling(dep.observed_state)
        : !isBilling(dep.observed_state);

  if (editing) {
    return (
      <ScheduleEditor
        dep={dep}
        onClose={() => setEditing(false)}
        pending={actions.setSchedule.isPending}
        error={actions.setSchedule.error as Error | null}
        onSave={(next) =>
          actions.setSchedule.mutate(next, { onSuccess: () => setEditing(false) })
        }
      />
    );
  }

  return (
    <div>
      <Row
        label="Schedule"
        action={
          <div className="flex items-center gap-3">
            {schedule && (
              <button
                type="button"
                onClick={() => actions.clearSchedule.mutate()}
                disabled={actions.clearSchedule.isPending}
                className="font-mono text-label text-ink-muted transition-colors hover:text-danger"
              >
                clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
            >
              {schedule ? "edit" : "set"}
            </button>
          </div>
        }
      >
        {schedule == null ? (
          <span className="text-ink-muted">manual control, runs until stopped</span>
        ) : (
          <div className="space-y-1">
            {schedule.rules.map((rule, i) => (
              <div key={i} className="text-ink-strong">
                <span className={rule.posture === "on" ? "text-accent-soft" : "text-ink-muted"}>
                  {postureVerb(rule.posture)}
                </span>{" "}
                {describeRule(rule)}
              </div>
            ))}
            <div className="text-ink-muted">
              {schedule.timezone} · otherwise {postureVerb(schedule.default_posture)}
            </div>
          </div>
        )}
      </Row>

      {schedule != null && (
        <div className="mt-2 flex items-center gap-2 font-mono text-label">
          {posture == null ? (
            <span className="text-ink-muted">
              cannot resolve {schedule.timezone} in this browser; the daemon still applies it
            </span>
          ) : (
            <>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  posture === "on" ? "bg-accent ol-pulse" : "bg-ink-muted",
                )}
              />
              <span className={posture === "on" ? "text-accent" : "text-ink-muted"}>
                {posture === "on" ? "on now" : "off now"}
              </span>
              {/* Only claim the daemon is driving it when the deployment actually agrees; the
                  mismatch line below says otherwise. */}
              {obeying !== false && (
                <span className="text-ink-muted">
                  · the daemon drives capacity to match, so spend follows the plan
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* A schedule only takes effect if something is reconciling it. Saying so beats a user watching
          a scheduled-off pod keep billing and concluding the schedule does not work. */}
      {obeying === false && (
        <p className="mt-2 max-w-[60ch] font-mono text-label text-warn">
          {posture === "off"
            ? "Scheduled off but still running. Nothing is applying the schedule: start the daemon with gpu up."
            : "Scheduled on but not running. Nothing is applying the schedule: start the daemon with gpu up."}
        </p>
      )}

      {schedule != null && simple == null && (
        <p className="mt-2 max-w-[60ch] font-mono text-label text-ink-muted">
          Set from the CLI with more than one window. Editing here would replace it with a single
          window, so edit it with{" "}
          <span className="text-accent-soft">gpu schedule {dep.id}</span> to keep the shape.
        </p>
      )}
    </div>
  );
}

function ScheduleEditor({
  dep,
  onSave,
  onClose,
  pending,
  error,
}: {
  dep: Deployment;
  onSave: (next: ReturnType<typeof buildSchedule>) => void;
  onClose: () => void;
  pending: boolean;
  error: Error | null;
}) {
  const existing = dep.schedule ? simpleWindow(dep.schedule) : null;
  const [days, setDays] = useState<number[]>(existing?.days ?? WEEKDAYS);
  const [start, setStart] = useState(existing?.start ?? "09:00");
  const [end, setEnd] = useState(existing?.end ?? "18:00");
  const [tz, setTz] = useState(dep.schedule?.timezone ?? browserZone());

  const invalid = windowError(days, start, end);
  const toggle = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="ol-label">Schedule</span>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
        >
          cancel
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DAY_LABELS.map((label, d) => (
          <button
            key={label}
            type="button"
            onClick={() => toggle(d)}
            className={cn(
              "h-8 w-11 rounded-md border font-mono text-label transition-colors",
              days.includes(d)
                ? "border-accent-soft bg-accent/10 text-accent"
                : "border-rule text-ink-muted hover:border-rule-strong hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.6fr]">
        <label className="block">
          <span className="ol-label mb-1.5">On at</span>
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="09:00"
            className="ol-control"
          />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Off at</span>
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="18:00"
            className="ol-control"
          />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Timezone</span>
          <select value={tz} onChange={(e) => setTz(e.target.value)} className="ol-control">
            {zoneOptions().map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
            {!zoneOptions().includes(tz) && <option value={tz}>{tz}</option>}
          </select>
        </label>
      </div>

      <p className="mt-3 max-w-[60ch] font-mono text-label text-ink-muted">
        Up inside the window, torn down outside it. An &ldquo;off at&rdquo; earlier than
        &ldquo;on at&rdquo; runs overnight.
      </p>

      {(invalid || error) && (
        <p className="mt-2 text-small text-danger">{invalid ?? error?.message}</p>
      )}

      <div className="mt-3">
        <button
          type="button"
          disabled={!!invalid || pending}
          onClick={() => onSave(buildSchedule(days, start, end, tz))}
          className="ol-btn"
        >
          {pending ? "Saving…" : "Save schedule"}
        </button>
      </div>
    </div>
  );
}

// --- concurrency limit ----------------------------------------------------------------

function LimitsPart({ dep }: { dep: Deployment }) {
  const actions = useCapacityActions(dep.id);
  const [editing, setEditing] = useState(false);
  const [max, setMax] = useState(String(dep.max_concurrency ?? 16));
  const [queue, setQueue] = useState(String(dep.max_queue));
  const [timeout, setTimeoutS] = useState(String(dep.queue_timeout_s));

  const parsed = Number(max);
  const invalid =
    !Number.isInteger(parsed) || parsed < 1 ? "max concurrency must be a whole number, 1 or more" : null;

  if (!editing) {
    return (
      <Row
        label="Concurrency"
        action={
          <div className="flex items-center gap-3">
            {dep.max_concurrency != null && (
              <button
                type="button"
                onClick={() => actions.clearLimits.mutate()}
                disabled={actions.clearLimits.isPending}
                className="font-mono text-label text-ink-muted transition-colors hover:text-danger"
              >
                clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
            >
              {dep.max_concurrency != null ? "edit" : "set"}
            </button>
          </div>
        }
      >
        {dep.max_concurrency == null ? (
          <span className="text-ink-muted">unlimited, the proxy admits every request</span>
        ) : (
          <div>
            <span className="text-ink-strong">{dep.max_concurrency} in flight</span>
            <span className="text-ink-muted">
              {dep.max_queue > 0
                ? ` · ${dep.max_queue} may queue up to ${dep.queue_timeout_s}s`
                : " · no queue, extra requests get a 429"}
            </span>
          </div>
        )}
      </Row>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="ol-label">Concurrency</span>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-mono text-label text-ink-muted transition-colors hover:text-ink-strong"
        >
          cancel
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="ol-label mb-1.5">Max in flight</span>
          <input value={max} onChange={(e) => setMax(e.target.value)} className="ol-control" />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Queue</span>
          <input value={queue} onChange={(e) => setQueue(e.target.value)} className="ol-control" />
        </label>
        <label className="block">
          <span className="ol-label mb-1.5">Wait (s)</span>
          <input
            value={timeout}
            onChange={(e) => setTimeoutS(e.target.value)}
            className="ol-control"
          />
        </label>
      </div>
      <p className="mt-3 max-w-[60ch] font-mono text-label text-ink-muted">
        A running proxy picks this up on its next restart. Anything past the queue gets a 429 rather
        than piling onto the GPU.
      </p>
      {(invalid || actions.setLimits.isError) && (
        <p className="mt-2 text-small text-danger">
          {invalid ?? (actions.setLimits.error as Error).message}
        </p>
      )}
      <div className="mt-3">
        <button
          type="button"
          disabled={!!invalid || actions.setLimits.isPending}
          onClick={() =>
            actions.setLimits.mutate(
              {
                max_concurrency: parsed,
                max_queue: Number(queue) || 0,
                queue_timeout_s: Number(timeout) || 30,
              },
              { onSuccess: () => setEditing(false) },
            )
          }
          className="ol-btn"
        >
          {actions.setLimits.isPending ? "Saving…" : "Save limit"}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="ol-label">{label}</span>
        {action}
      </div>
      <div className="font-mono text-small">{children}</div>
    </div>
  );
}
