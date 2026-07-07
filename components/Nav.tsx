"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS: { label: string; href: string | null }[] = [
  { label: "Overview", href: "/" },
  { label: "Deploy", href: "/deploy" },
  { label: "Playground", href: "/playground" },
  { label: "Docs", href: "/docs" },
  { label: "Costs", href: null },
];

export function Nav() {
  const pathname = usePathname();
  const base = "flex items-center justify-between rounded-md px-2.5 py-1.5 text-small";

  return (
    <nav className="space-y-1">
      {ITEMS.map((item) => {
        if (item.href == null) {
          return (
            <div key={item.label} className={cn(base, "text-ink-muted")}>
              <span>{item.label}</span>
              <span className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase opacity-60">
                soon
              </span>
            </div>
          );
        }
        const active =
          item.href === "/"
            ? pathname === "/" || pathname.startsWith("/deployment")
            : pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              base,
              active ? "bg-surface text-ink-strong" : "text-ink-muted hover:text-ink",
            )}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
