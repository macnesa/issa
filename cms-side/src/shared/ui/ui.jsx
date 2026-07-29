import { useRef } from "react";
import { Link } from "react-router-dom";

export function PageContainer({ children, className = "" }) {
  return <main className={`issa-page-container ${className}`}>{children}</main>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  metadata,
  actions,
}) {
  return (
    <header className="issa-page-header">
      <div className="issa-page-header__copy">
        {eyebrow && <p className="issa-page-header__eyebrow">{eyebrow}</p>}
        <h1 className="issa-page-header__title">{title}</h1>
        {description && (
          <p className="issa-page-header__description">{description}</p>
        )}
        {metadata && (
          <div className="issa-page-header__metadata">{metadata}</div>
        )}
      </div>
      {actions && <div className="issa-page-header__actions">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  id,
}) {
  return (
    <header className="issa-section-header">
      <div className="issa-section-header__copy">
        {eyebrow && <p className="issa-section-header__eyebrow">{eyebrow}</p>}
        <h2 className="issa-section-header__title" id={id}>{title}</h2>
        {description && (
          <p className="issa-section-header__description">{description}</p>
        )}
      </div>
      {actions && <div className="issa-section-header__actions">{actions}</div>}
    </header>
  );
}

export function Surface({
  as: Component = "section",
  children,
  className = "",
  variant = "default",
  ...props
}) {
  return (
    <Component
      className={`issa-surface issa-surface--${variant} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function MetricCard({ label, value, detail }) {
  return (
    <Surface className="issa-metric-card">
      <p className="issa-metric-card__label">{label}</p>
      <p className="issa-metric-card__value">{value}</p>
      {detail && <p className="issa-metric-card__detail">{detail}</p>}
    </Surface>
  );
}

const statusToneByLabel = {
  Hadir: "success",
  Sakit: "info",
  Izin: "warning",
  Alfa: "danger",
  Lulus: "success",
  "Belum lulus": "warning",
};

export function StatusBadge({ status, tone }) {
  const resolvedTone = tone || statusToneByLabel[status] || "neutral";
  return (
    <span
      className={`issa-status-badge issa-status-badge--${resolvedTone} inline-flex`}
      data-tone={resolvedTone}
    >
      {status || "Belum ada"}
    </span>
  );
}

export function FormField({
  label,
  children,
  hint,
  error,
  className = "",
}) {
  return (
    <label className={`issa-form-field ${className}`}>
      <span className="issa-form-field__label">{label}</span>
      {children}
      {error ? (
        <span className="issa-form-field__error">{error}</span>
      ) : hint ? (
        <span className="issa-form-field__helper">{hint}</span>
      ) : null}
    </label>
  );
}

function Button({
  children,
  className = "",
  tone = "primary",
  compact = false,
  disabled = false,
  loading = false,
  loadingLabel = "Memproses…",
  ...props
}) {
  return (
    <button
      className={`issa-button issa-button--${tone}${compact ? " issa-button--compact" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export function PrimaryButton(props) {
  return <Button tone="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button tone="secondary" {...props} />;
}

export function TertiaryButton(props) {
  return <Button tone="tertiary" {...props} />;
}

export function DestructiveButton(props) {
  return <Button tone="destructive" {...props} />;
}

export function ButtonLink({
  children,
  className = "",
  compact = false,
  tone = "secondary",
  ...props
}) {
  return (
    <Link
      className={`issa-button issa-button--${tone}${compact ? " issa-button--compact" : ""} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function LoadingState({ label = "Memuat data..." }) {
  return (
    <div className="issa-state issa-state--loading" role="status">
      {label}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="issa-state issa-state--empty">
      <p className="issa-state__title">{title}</p>
      {description && (
        <p className="issa-state__description">{description}</p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="issa-state issa-state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <SecondaryButton type="button" onClick={onRetry}>
          Coba lagi
        </SecondaryButton>
      )}
    </div>
  );
}

export function InlineNotice({
  children,
  tone = "neutral",
  role = "status",
  className = "",
}) {
  return (
    <p
      className={`issa-inline-notice issa-inline-notice--${tone} ${className}`}
      role={role}
    >
      {children}
    </p>
  );
}

export function WorkspaceTabs({
  items,
  activeId,
  onChange,
  ariaLabel,
  idPrefix = "workspace",
  className = "",
}) {
  const tabRefs = useRef([]);

  const activateByIndex = (index) => {
    const nextItem = items[index];
    if (!nextItem) return;
    onChange(nextItem.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    activateByIndex(nextIndex);
  };

  return (
    <nav
      className={`issa-workspace-tabs ${className}`}
      aria-label={ariaLabel}
    >
      <div className="issa-workspace-tabs__list" role="tablist">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const tabId = `${idPrefix}-tab-${item.id}`;
          const panelId = `${idPrefix}-${item.id}`;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId}
              className="issa-workspace-tabs__tab"
              type="button"
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function WorkspacePanel({
  id,
  labelledBy,
  children,
  className = "",
}) {
  return (
    <section
      id={id}
      className={`issa-workspace-panel ${className}`}
      role="tabpanel"
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}

export function StudentContextHeader({
  student,
  classLabel,
  eyebrow = "Record siswa",
  headingLevel = "h2",
  metadata = [],
  actions,
}) {
  const Heading = headingLevel;
  const studentName = student?.name || "Detail siswa";
  const imageUrl = student?.imgUrl;
  const facts = [
    { label: "NIM", value: student?.NIM || "—", noWrap: true },
    { label: "Kelas", value: classLabel || "—" },
    ...metadata,
  ];

  return (
    <header className="issa-student-context">
      <div className="issa-student-context__identity">
        {imageUrl ? (
          <img
            className="issa-student-context__portrait"
            src={imageUrl}
            alt={studentName}
          />
        ) : (
          <div
            className="issa-student-context__portrait issa-student-context__portrait--fallback"
            aria-hidden="true"
          >
            {studentName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="issa-student-context__copy">
          <p className="issa-student-context__eyebrow">{eyebrow}</p>
          <Heading className="issa-student-context__name">
            {studentName}
          </Heading>
          <dl className="issa-student-context__facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className={fact.noWrap ? "issa-no-wrap" : undefined}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {actions && (
        <div className="issa-student-context__actions">{actions}</div>
      )}
    </header>
  );
}

export function LedgerShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  loading = false,
  loadingLabel,
  error,
  onRetry,
  empty = false,
  emptyTitle,
  emptyDescription,
  overflow = false,
  className = "",
}) {
  let content = children;
  if (loading) {
    content = <LoadingState label={loadingLabel} />;
  } else if (error) {
    content = <ErrorState message={error} onRetry={onRetry} />;
  } else if (empty) {
    content = (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <section className={`issa-ledger-shell ${className}`}>
      {(eyebrow || title || description) && (
        <header className="issa-ledger-shell__header">
          <div>
            {eyebrow && <p>{eyebrow}</p>}
            {title && <h2>{title}</h2>}
            {description && <span>{description}</span>}
          </div>
          {actions && (
            <div className="issa-ledger-shell__actions">{actions}</div>
          )}
        </header>
      )}
      <div
        className={`issa-ledger-shell__body${overflow ? " issa-ledger-shell__body--overflow" : ""}`}
      >
        {content}
      </div>
    </section>
  );
}
