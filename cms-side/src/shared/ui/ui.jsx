export function PageContainer({ children, className = "" }) {
  return <main className={`mx-auto w-full max-w-[var(--container)] px-4 py-6 sm:px-6 lg:px-8 ${className}`}>{children}</main>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Surface({ children, className = "" }) {
  return <section className={`rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${className}`}>{children}</section>;
}

export function MetricCard({ label, value, detail }) {
  return <Surface className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold text-[var(--text)]">{value}</p>{detail && <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>}</Surface>;
}

export function StatusBadge({ status }) {
  const styles = {
    Hadir: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Sakit: "bg-amber-50 text-amber-700 ring-amber-200",
    Izin: "bg-sky-50 text-sky-700 ring-sky-200",
    Alfa: "bg-rose-50 text-rose-700 ring-rose-200",
    Lulus: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Belum lulus": "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{status || "Belum ada"}</span>;
}

export function FormField({ label, children, hint, className = "" }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-[var(--text)]">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span>}</label>;
}

export function PrimaryButton({ children, className = "", ...props }) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>{children}</button>;
}

export function LoadingState({ label = "Memuat data..." }) {
  return <div className="flex min-h-48 items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--muted)]">{label}</div>;
}

export function EmptyState({ title, description }) {
  return <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-slate-50 px-5 py-8 text-center"><p className="font-semibold text-[var(--text)]">{title}</p>{description && <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">{description}</p>}</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{message}</p>{onRetry && <SecondaryButton className="mt-3" type="button" onClick={onRetry}>Coba lagi</SecondaryButton>}</div>;
}
