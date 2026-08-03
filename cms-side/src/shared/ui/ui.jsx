import { tw } from "./tw";
import { useRef } from "react";
import { Link } from "react-router-dom";

const surfaceVariants = {
  default: "",
  subtle: "bg-issa-subtle",
  emphasized: "border-emphasis border-issa-border-strong shadow-elevated",
};

const statusTones = {
  success: "bg-[color-mix(in_srgb,var(--issa-success)_10%,var(--issa-surface))] text-issa-success",
  warning: "bg-[color-mix(in_srgb,var(--issa-warning)_10%,var(--issa-surface))] text-issa-warning",
  danger: "bg-[color-mix(in_srgb,var(--issa-danger)_10%,var(--issa-surface))] text-issa-danger",
  info: "bg-[color-mix(in_srgb,var(--issa-info)_10%,var(--issa-surface))] text-issa-info",
  neutral: "bg-issa-subtle text-issa-muted",
};

const buttonTones = {
  primary: "border-issa-text bg-issa-accent text-issa-inverse enabled:hover:bg-issa-text",
  secondary: "border-issa-border-strong bg-issa-surface text-issa-text enabled:hover:border-issa-accent enabled:hover:bg-issa-subtle",
  tertiary: "bg-transparent text-issa-accent enabled:hover:bg-issa-subtle enabled:hover:text-issa-text",
  destructive: "border-issa-danger bg-issa-danger text-issa-inverse enabled:hover:bg-[color-mix(in_srgb,var(--issa-danger)_84%,black)] focus-visible:outline-[color-mix(in_srgb,var(--issa-danger)_38%,var(--issa-surface))]",
  login: "min-h-[2.8rem] rounded-[0.08rem] border-2 border-[#173e52] bg-[#245b70] text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-issa-inverse shadow-[0.12rem_0.14rem_0_#88a5ae] enabled:hover:bg-[#173e52] disabled:opacity-60",
};

const noticeTones = {
  neutral: "text-issa-muted",
  success: "text-issa-success",
  warning: "text-issa-warning",
  danger: "text-issa-danger",
  info: "text-issa-info",
};

const buttonBase = "issa-button inline-flex min-h-control items-center justify-center gap-2 rounded-control border border-transparent px-4 py-2 text-center text-button font-bold leading-tight transition-[background-color,border-color,color,box-shadow,transform] duration-default enabled:active:translate-x-px enabled:active:translate-y-px enabled:active:shadow-none focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:border-issa-border disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:shadow-none motion-reduce:transition-none";

export function PageContainer({ children, className = "", ...props }) {
  return (
    <main
      id="cms-main-content"
      className={tw("issa-page-container w-full max-w-content mx-auto [padding:var(--issa-space-6)_var(--issa-space-4)] focus:outline-none sm:pr-6 sm:pl-6 lg:pr-8 lg:pl-8", className)}
      tabIndex={-1}
      {...props}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  metadata,
  actions,
}) {
  return (
    <header className={tw("issa-page-header mb-6 flex items-end justify-between gap-4 border-b border-issa-border pb-4 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-page-header__copy min-w-0")}>
        {eyebrow && <p className={tw("issa-page-header__eyebrow text-eyebrow font-bold uppercase leading-tight tracking-metadata text-issa-accent")}>{eyebrow}</p>}
        <h1 className={tw("issa-page-header__title mt-1 text-issa-text text-page-title font-bold tracking-title leading-tight")}>{title}</h1>
        {description && (
          <p className={tw("issa-page-header__description [max-width:68ch] mt-2 text-issa-muted text-body leading-normal")}>{description}</p>
        )}
        {metadata && (
          <div className={tw("issa-page-header__metadata mt-3 text-issa-muted text-metadata")}>{metadata}</div>
        )}
      </div>
      {actions && <div className={tw("issa-page-header__actions flex flex-none flex-wrap items-center gap-2 max-sm:justify-start")}>{actions}</div>}
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
    <header className={tw("issa-section-header mb-4 flex min-w-0 items-end justify-between gap-4 border-b border-issa-border pb-3 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-section-header__copy min-w-0")}>
        {eyebrow && <p className={tw("issa-section-header__eyebrow text-issa-accent text-eyebrow font-bold tracking-metadata uppercase")}>{eyebrow}</p>}
        <h2 className={tw("issa-section-header__title mt-1 text-issa-text text-section-title font-bold leading-tight")} id={id}>{title}</h2>
        {description && (
          <p className={tw("issa-section-header__description [max-width:68ch] mt-1 text-issa-muted text-supporting leading-normal")}>{description}</p>
        )}
      </div>
      {actions && <div className={tw("issa-section-header__actions flex flex-none flex-wrap items-center gap-2 max-sm:justify-start")}>{actions}</div>}
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
      className={tw("issa-surface rounded-surface border border-issa-border bg-issa-surface", `issa-surface--${variant}`, surfaceVariants[variant] || surfaceVariants.default, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function MetricCard({ label, value, detail }) {
  return (
    <Surface className={tw("issa-metric-card p-4")}>
      <p className={tw("issa-metric-card__label text-issa-muted text-metadata font-bold tracking-metadata uppercase")}>{label}</p>
      <p className={tw("issa-metric-card__value mt-2 text-issa-text text-2xl font-bold")}>{value}</p>
      {detail && <p className={tw("issa-metric-card__detail mt-1 text-issa-muted text-supporting")}>{detail}</p>}
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
      className={tw("issa-status-badge inline-flex items-center rounded-full border border-current px-2 py-1 text-status font-semibold leading-tight", `issa-status-badge--${resolvedTone}`, statusTones[resolvedTone] || statusTones.neutral)}
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
    <label className={tw("issa-form-field block", className)}>
      <span className={tw("issa-form-field__label block mb-1 text-issa-text text-label font-semibold")}>{label}</span>
      {children}
      {error ? (
        <span className={tw("issa-form-field__error mt-1 block text-metadata font-semibold leading-normal text-issa-danger")}>{error}</span>
      ) : hint ? (
        <span className={tw("issa-form-field__helper mt-1 block text-metadata leading-normal text-issa-muted")}>{hint}</span>
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
      className={tw(buttonBase, `issa-button--${tone}`, buttonTones[tone] || buttonTones.primary, compact && "issa-button--compact min-h-control-compact px-3 py-1 text-metadata", className)}
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
      className={tw(buttonBase, `issa-button--${tone}`, buttonTones[tone] || buttonTones.secondary, compact && "issa-button--compact min-h-control-compact px-3 py-1 text-metadata", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function LoadingState({ label = "Memuat data..." }) {
  return (
    <div
      className={tw("issa-state grid [min-height:9rem] place-items-center border border-dashed border-issa-border-strong rounded-surface bg-issa-surface p-6 text-issa-muted text-body text-center issa-state--loading")}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div
      className={tw("issa-state grid [min-height:9rem] place-items-center border border-dashed border-issa-border-strong rounded-surface bg-issa-surface p-6 text-issa-muted text-body text-center issa-state--empty content-center")}
      role="status"
      aria-live="polite"
    >
      <p className={tw("issa-state__title text-issa-text font-semibold")}>{title}</p>
      {description && (
        <p className={tw("issa-state__description [max-width:32rem] mt-1 text-issa-muted text-supporting")}>{description}</p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={tw("issa-state issa-state--error grid min-h-36 place-items-center justify-items-start rounded-surface border border-[color-mix(in_srgb,var(--issa-danger)_35%,var(--issa-border))] bg-[color-mix(in_srgb,var(--issa-danger)_8%,var(--issa-surface))] p-6 text-left text-body text-issa-danger [&_.issa-button]:mt-3")} role="alert">
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
      className={tw("issa-inline-notice m-0 border-l-emphasis border-current bg-issa-subtle px-3 py-2 text-supporting leading-normal", `issa-inline-notice--${tone}`, noticeTones[tone] || noticeTones.neutral, className)}
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
      className={tw(`issa-workspace-tabs min-w-0 overflow-x-auto [overscroll-behavior-inline:contain] [scroll-padding-inline:var(--issa-space-2)] [scroll-snap-type:inline_proximity] [scrollbar-color:var(--issa-border-strong)_transparent] [scrollbar-width:thin] border border-issa-border-strong rounded-surface bg-issa-surface ${className}`)}
      aria-label={ariaLabel}
    >
      <div className={tw("issa-workspace-tabs__list flex [width:max-content] [min-width:100%]")} role="tablist">
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
              className={tw("issa-workspace-tabs__tab relative min-h-control flex-none snap-start border-0 border-r border-issa-border bg-issa-surface px-4 py-2 text-button font-semibold leading-tight text-issa-text last:border-r-0 hover:bg-issa-subtle aria-selected:bg-issa-text aria-selected:text-issa-inverse aria-selected:hover:bg-issa-text aria-selected:[box-shadow:inset_0_calc(-1_*_var(--issa-border-width-emphasis))_0_var(--issa-selection)] focus-visible:z-[1] focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus")}
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
      className={tw(`issa-workspace-panel min-w-0 mt-6 ${className}`)}
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
    <header className={tw("issa-student-context flex min-w-0 items-center justify-between gap-6 rounded-surface border-emphasis border-issa-text bg-issa-surface p-4 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-student-context__identity flex min-w-0 items-center gap-4 max-sm:items-start")}>
        {imageUrl ? (
          <img
            className={tw("issa-student-context__portrait w-14 h-14 flex-none border border-issa-border-strong rounded-control bg-issa-subtle object-cover")}
            src={imageUrl}
            alt={studentName}
          />
        ) : (
          <div
            className={tw("issa-student-context__portrait w-14 h-14 flex-none border border-issa-border-strong rounded-control bg-issa-subtle object-cover issa-student-context__portrait--fallback grid place-items-center text-issa-text text-section-title font-bold")}
            aria-hidden="true"
          >
            {studentName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className={tw("issa-student-context__copy min-w-0")}>
          <p className={tw("issa-student-context__eyebrow text-eyebrow font-bold uppercase leading-tight tracking-metadata text-issa-accent")}>{eyebrow}</p>
          <Heading className={tw("issa-student-context__name mt-1 text-issa-text text-page-title font-bold tracking-title leading-tight [overflow-wrap:anywhere]")}>
            {studentName}
          </Heading>
          <dl className={tw("issa-student-context__facts mt-3 flex min-w-0 flex-wrap max-sm:grid max-sm:w-full max-sm:grid-cols-2")}>
            {facts.map((fact) => (
              <div className={tw("min-w-28 border-l border-issa-border px-3 first:border-l-0 first:pl-0 max-sm:min-w-0 max-sm:border-l-0 max-sm:border-t max-sm:pb-0 max-sm:pl-0 max-sm:pr-3 max-sm:pt-2 max-sm:even:border-l max-sm:even:pl-3 max-sm:even:pr-0 max-sm:last:odd:col-span-2")} key={fact.label}>
                <dt className={tw("text-metadata font-bold uppercase leading-tight tracking-metadata text-issa-muted")}>{fact.label}</dt>
                <dd className={tw("mt-1 text-body font-semibold text-issa-text", fact.noWrap && "issa-no-wrap whitespace-nowrap")}>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {actions && (
        <div className={tw("issa-student-context__actions flex flex-none flex-wrap justify-end gap-2 max-sm:justify-start max-sm:[&>*]:flex-1")}>{actions}</div>
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
    <section className={tw(`issa-ledger-shell overflow-hidden border border-issa-border-strong rounded-surface bg-issa-surface ${className}`)}>
      {(eyebrow || title || description) && (
        <header className={tw("issa-ledger-shell__header flex items-end justify-between gap-4 border-b border-issa-border bg-issa-subtle p-4 max-sm:flex-col max-sm:items-stretch")}>
          <div>
            {eyebrow && <p className={tw("text-eyebrow font-bold uppercase leading-tight tracking-metadata text-issa-accent")}>{eyebrow}</p>}
            {title && <h2 className={tw("mt-1 text-section-title font-bold leading-tight text-issa-text")}>{title}</h2>}
            {description && <span className={tw("mt-1 block text-supporting leading-normal text-issa-muted")}>{description}</span>}
          </div>
          {actions && (
            <div className={tw("issa-ledger-shell__actions flex flex-none flex-wrap items-center gap-2 max-sm:justify-start")}>{actions}</div>
          )}
        </header>
      )}
      <div
        className={tw(`issa-ledger-shell__body min-w-0${overflow ? " issa-ledger-shell__body--overflow overflow-x-auto" : ""}`)}
      >
        {content}
      </div>
    </section>
  );
}
