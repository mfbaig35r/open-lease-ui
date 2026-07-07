/** One title treatment for every page: same size, weight, and spacing. `sub` is the contextual
 *  subtitle line (a description or a status), `actions` sits on the right (a select, a dot). */
export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-h1 text-ink-strong">{title}</h1>
        {sub != null && <div className="mt-2 text-small text-ink-muted">{sub}</div>}
      </div>
      {actions != null && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
