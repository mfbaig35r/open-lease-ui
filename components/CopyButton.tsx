"use client";

import { useState } from "react";

/** A small mono "copy" affordance that flips to "copied" for a beat. Matches .ol-label styling. */
export function CopyButton({ value, label = "copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard blocked (non-secure origin); no-op */
        }
      }}
      className="ol-label transition-colors hover:text-ink"
    >
      {copied ? "copied" : label}
    </button>
  );
}
