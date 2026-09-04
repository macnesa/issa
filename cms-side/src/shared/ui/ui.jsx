import { tw } from "./tw";
import { useRef } from "react";
import { Alert } from "flowbite-react/components/Alert";
import { Badge } from "flowbite-react/components/Badge";
import { Button as FlowbiteButton } from "flowbite-react/components/Button";
import { Spinner } from "flowbite-react/components/Spinner";
import { Link } from "react-router-dom";

const surfaceVariants = {
  default: "",
  subtle: "bg-issa-subtle",
  emphasized: "border-emphasis border-issa-border-strong shadow-elevated",
};

const noticeColors = {
  neutral: "gray",
  success: "success",
  warning: "warning",
  danger: "failure",
  info: "info",
};

export function PageContainer({ children, className = "", ...props }) {
  return (
    <main
      id="cms-main-content"
      className={tw("issa-page-container w-full max-w-content mx-auto px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}
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
    <header className={tw("issa-page-header mb-8 flex items-start justify-between gap-6 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-page-header__copy min-w-0")}>
        {eyebrow && <p className={tw("issa-page-header__eyebrow text-eyebrow font-semibold leading-tight tracking-normal text-issa-accent")}>{eyebrow}</p>}
        <h1 className={tw("issa-page-header__title mt-1.5 text-issa-text text-page-title font-semibold tracking-title leading-[1.08]")}>{title}</h1>
        {description && (
          <p className={tw("issa-page-header__description [max-width:62ch] mt-3 text-issa-muted text-body leading-relaxed")}>{description}</p>
        )}
        {metadata && (
          <div className={tw("issa-page-header__metadata mt-3 text-issa-muted text-supporting")}>{metadata}</div>
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
    <header className={tw("issa-section-header mb-5 flex min-w-0 items-start justify-between gap-5 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-section-header__copy min-w-0")}>
        {eyebrow && <p className={tw("issa-section-header__eyebrow text-issa-accent text-eyebrow font-semibold tracking-normal")}>{eyebrow}</p>}
        <h2 className={tw("issa-section-header__title mt-1 text-issa-text text-section-title font-semibold leading-tight")} id={id}>{title}</h2>
        {description && (
          <p className={tw("issa-section-header__description [max-width:62ch] mt-2 text-issa-muted text-supporting leading-relaxed")}>{description}</p>
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
      className={tw("issa-surface rounded-surface border border-issa-border bg-issa-surface shadow-[0_1px_2px_rgba(24,50,59,0.035)]", `issa-surface--${variant}`, surfaceVariants[variant] || surfaceVariants.default, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function MetricCard({ label, value, detail }) {
  return (
    <Surface className={tw("issa-metric-card p-4")}>
      <p className={tw("issa-metric-card__label text-issa-muted text-metadata font-semibold tracking-normal")}>{label}</p>
      <p className={tw("issa-metric-card__value mt-2 text-issa-text text-2xl font-semibold")}>{value}</p>
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

const badgeColorsByTone = {
  neutral: "issaNeutral",
  success: "issaSuccess",
  warning: "issaWarning",
  danger: "issaDanger",
  error: "issaDanger",
  failure: "issaDanger",
  info: "issaInfo",
  attention: "issaAttention",
};

export function StatusBadge({ status, tone, className = "", ...props }) {
  const resolvedTone = tone || statusToneByLabel[status] || "neutral";
  return (
    <Badge
      {...props}
      color={badgeColorsByTone[resolvedTone] || "issaNeutral"}
      size="issa"
      className={tw("issa-status-badge", `issa-status-badge--${resolvedTone}`, className)}
      data-tone={resolvedTone}
    >
      {status || "Belum ada"}
    </Badge>
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

const supportedButtonTones = new Set([
  "primary",
  "secondary",
  "tertiary",
  "destructive",
  "login",
  "loginSecondary",
]);

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
  const {
    type,
    "aria-busy": ariaBusy,
    ...buttonProps
  } = props;
  const resolvedTone = supportedButtonTones.has(tone) ? tone : "primary";
  const resolvedSize = resolvedTone === "login" || resolvedTone === "loginSecondary"
    ? "login"
    : compact ? "sm" : "md";

  return (
    <FlowbiteButton
      {...buttonProps}
      type={type ?? null}
      color={resolvedTone}
      size={resolvedSize}
      className={tw(`issa-button--${resolvedTone}`, compact && "issa-button--compact", className)}
      disabled={disabled || loading}
      aria-busy={loading ? true : ariaBusy}
    >
      {loading ? (
        <>
          <Spinner
            aria-hidden="true"
            className={tw("issa-button__spinner flex-none fill-current text-current")}
            size="sm"
          />
          <span>{loadingLabel}</span>
        </>
      ) : children}
    </FlowbiteButton>
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
  const resolvedTone = supportedButtonTones.has(tone) ? tone : "secondary";
  return (
    <FlowbiteButton
      {...props}
      as={Link}
      type={null}
      color={resolvedTone}
      size={compact ? "sm" : "md"}
      className={tw(`issa-button--${resolvedTone}`, compact && "issa-button--compact", className)}
    >
      {children}
    </FlowbiteButton>
  );
}

export function LoadingState({ label = "Memuat data..." }) {
  return (
    <div
      className={tw("issa-state grid [min-height:9rem] place-items-center border border-dashed border-issa-border-strong rounded-surface bg-issa-surface p-6 text-issa-muted text-body text-center issa-state--loading")}
      role="status"
      aria-live="polite"
    >
      <span className={tw("issa-state__loading-content flex items-center justify-center gap-3")}>
        <Spinner aria-hidden="true" size="md" />
        <span>{label}</span>
      </span>
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
    <Alert
      className={tw("issa-state issa-state--error grid min-h-36 place-items-center justify-items-start text-left text-body [&_[data-testid=flowbite-alert-wrapper]]:grid [&_[data-testid=flowbite-alert-wrapper]]:justify-items-start [&_.issa-button]:mt-3")}
      color="failure"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <SecondaryButton type="button" onClick={onRetry}>
          Coba lagi
        </SecondaryButton>
      )}
    </Alert>
  );
}

export function InlineNotice({
  children,
  tone = "neutral",
  role = "status",
  className = "",
}) {
  return (
    <Alert
      className={tw("issa-inline-notice m-0 px-3 py-2 text-supporting leading-normal", `issa-inline-notice--${tone}`, className)}
      color={noticeColors[tone] || noticeColors.neutral}
      role={role}
    >
      {children}
    </Alert>
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
      className={tw(`issa-workspace-tabs min-w-0 overflow-x-auto [overscroll-behavior-inline:contain] [scroll-padding-inline:var(--issa-space-2)] [scroll-snap-type:inline_proximity] [scrollbar-color:var(--issa-border-strong)_transparent] [scrollbar-width:thin] border-b border-issa-border bg-transparent ${className}`)}
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
              className={tw("issa-workspace-tabs__tab relative min-h-control flex-none snap-start border-0 bg-transparent px-4 py-3 text-button font-semibold leading-tight text-issa-muted transition-colors duration-default hover:bg-issa-subtle hover:text-issa-text aria-selected:text-issa-text aria-selected:[box-shadow:inset_0_calc(-1_*_var(--issa-border-width-emphasis))_0_var(--issa-accent)] focus-visible:z-[1] focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus motion-reduce:transition-none")}
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
      className={tw(`issa-workspace-panel min-w-0 mt-8 ${className}`)}
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
    <header className={tw("issa-student-context flex min-w-0 items-center justify-between gap-8 border-b border-issa-border pb-6 max-sm:flex-col max-sm:items-stretch")}>
      <div className={tw("issa-student-context__identity flex min-w-0 items-center gap-5 max-sm:items-start")}>
        {imageUrl ? (
          <img
            className={tw("issa-student-context__portrait w-16 h-16 flex-none rounded-surface bg-issa-subtle object-cover ring-1 ring-issa-border")}
            src={imageUrl}
            alt={studentName}
          />
        ) : (
          <div
            className={tw("issa-student-context__portrait w-16 h-16 flex-none rounded-surface bg-issa-subtle object-cover ring-1 ring-issa-border issa-student-context__portrait--fallback grid place-items-center text-issa-text text-section-title font-bold")}
            aria-hidden="true"
          >
            {studentName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className={tw("issa-student-context__copy min-w-0")}>
          <p className={tw("issa-student-context__eyebrow text-eyebrow font-semibold leading-tight tracking-normal text-issa-accent")}>{eyebrow}</p>
          <Heading className={tw("issa-student-context__name mt-1.5 text-issa-text text-page-title font-semibold tracking-title leading-[1.08] [overflow-wrap:anywhere]")}>
            {studentName}
          </Heading>
          <dl className={tw("issa-student-context__facts mt-4 grid min-w-0 grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-0")}>
            {facts.map((fact, index) => (
              <div className={tw("min-w-0 sm:min-w-28 sm:px-4", index === 0 ? "sm:pl-0" : "sm:border-l sm:border-issa-border")} key={fact.label}>
                <dt className={tw("text-metadata font-medium leading-tight tracking-normal text-issa-muted")}>{fact.label}</dt>
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
  id,
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
    <section id={id} className={tw(`issa-ledger-shell min-w-0 border-y border-issa-border bg-transparent ${className}`)}>
      {(eyebrow || title || description) && (
        <header className={tw("issa-ledger-shell__header flex items-start justify-between gap-5 border-b border-issa-border bg-transparent py-4 max-sm:flex-col max-sm:items-stretch")}>
          <div>
            {eyebrow && <p className={tw("text-eyebrow font-semibold leading-tight tracking-normal text-issa-accent")}>{eyebrow}</p>}
            {title && <h2 className={tw("mt-1 text-section-title font-semibold leading-tight text-issa-text")}>{title}</h2>}
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
