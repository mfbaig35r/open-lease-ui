// Reading and writing operating schedules (open-lease plan Tier A1) client-side.
//
// The backend owns resolution: the daemon evaluates the schedule each tick and drives desired_state.
// What happens here is presentation only, so the workbench can say "on now, off at 18:00" instead of
// printing a rules array. `postureAt` mirrors core/schedule.py's resolve_posture (first matching rule
// wins, a window whose start is later than its end wraps past midnight) and must keep matching it.

import type { Posture, Schedule, ScheduleRule } from "./types";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS = [0, 1, 2, 3, 4];

/** IANA zones offered in the editor, with the viewer's own zone first so the common case is one
 *  click. A schedule set from the CLI can name any zone; this list only seeds the picker. */
export function zoneOptions(): string[] {
  const local = browserZone();
  const common = [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Singapore",
    "Asia/Tokyo",
  ];
  return [local, ...common.filter((z) => z !== local)];
}

export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The weekday (0=Mon) and minutes-since-midnight in `tz` at `nowMs`, or null if the zone is
 *  unknown to this browser (a CLI-set schedule can name a zone Intl does not have). */
export function zoneClock(tz: string, nowMs: number): { day: number; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(nowMs));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const day = DAY_LABELS.indexOf(get("weekday") as (typeof DAY_LABELS)[number]);
    if (day < 0) return null;
    // hour12:false yields "24" for midnight in some engines; fold it back to 0.
    const hour = Number(get("hour")) % 24;
    const minute = Number(get("minute"));
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { day, minutes: hour * 60 + minute };
  } catch {
    return null;
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function inWindow(minutes: number, start: string, end: string): boolean {
  const lo = toMinutes(start);
  const hi = toMinutes(end);
  return lo <= hi ? minutes >= lo && minutes < hi : minutes >= lo || minutes < hi;
}

/** The posture in force right now, or null when it cannot be resolved in this browser. */
export function postureAt(schedule: Schedule, nowMs: number): Posture | null {
  const clock = zoneClock(schedule.timezone, nowMs);
  if (clock == null) return null;
  for (const rule of schedule.rules) {
    if (rule.days.includes(clock.day) && inWindow(clock.minutes, rule.start, rule.end)) {
      return rule.posture;
    }
  }
  return schedule.default_posture;
}

/** "Mon-Fri", "Mon, Wed, Fri", "Every day" for a rule's day set. */
export function describeDays(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 0) return "never";
  if (sorted.length === 7) return "Every day";
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 2) {
    return `${DAY_LABELS[sorted[0]]}-${DAY_LABELS[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_LABELS[d]).join(", ");
}

export function describeRule(rule: ScheduleRule): string {
  const wrap = toMinutes(rule.start) > toMinutes(rule.end) ? " (overnight)" : "";
  return `${describeDays(rule.days)} ${rule.start}-${rule.end}${wrap}`;
}

/** A posture as what it does to capacity, which is what the reader cares about. */
export function postureVerb(posture: Posture): string {
  return posture === "on" ? "up" : "down";
}

/** A schedule the editor can round-trip: exactly one ON window, everything else off. Anything else
 *  (several windows, a default-on schedule) is shown read-only rather than silently flattened. */
export function simpleWindow(schedule: Schedule): ScheduleRule | null {
  if (schedule.default_posture !== "off") return null;
  if (schedule.rules.length !== 1) return null;
  return schedule.rules[0].posture === "on" ? schedule.rules[0] : null;
}

export function buildSchedule(days: number[], start: string, end: string, tz: string): Schedule {
  return {
    timezone: tz,
    default_posture: "off",
    rules: [{ days: [...days].sort((a, b) => a - b), start, end, posture: "on" }],
  };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Why this window cannot be saved, or null when it is valid. The backend validates too; this only
 *  spares a round trip and points at the offending field. */
export function windowError(days: number[], start: string, end: string): string | null {
  if (days.length === 0) return "pick at least one day";
  if (!HHMM.test(start) || !HHMM.test(end)) return "times must be HH:MM (24-hour)";
  if (start === end) return "start and end cannot be the same time";
  return null;
}
