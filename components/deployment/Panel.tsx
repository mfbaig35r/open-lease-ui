export function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase">{title}</h2>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
