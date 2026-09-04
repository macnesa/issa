import { Link } from 'react-router-dom';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PageContainer({ as: Component = 'main', className = '', children }) {
  return (
    <Component id="parent-main-content" tabIndex={-1} className={joinClasses('page-container', className)}>
      {children}
    </Component>
  );
}

export function PageHeader({ title, description, kicker, wide = false, children }) {
  return (
    <header className={joinClasses('page-header', wide && 'page-header--wide')}>
      {kicker && <p className="section-kicker">{kicker}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-supporting-text">{description}</p>}
      {children}
    </header>
  );
}

export function Surface({
  as: Component = 'section',
  className = '',
  padded = true,
  muted = false,
  aqua = false,
  offset = false,
  children,
  ...props
}) {
  return (
    <Component
      className={joinClasses(
        'surface',
        padded && 'surface--padded',
        muted && 'surface--muted',
        aqua && 'surface--aqua',
        offset && 'surface--offset',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ kicker, title, action, description, titleId, titleRef }) {
  return (
    <header className="section-header">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2
          className="section-heading"
          id={titleId}
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
        >
          {title}
        </h2>
        {description && <p className="page-supporting-text">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Button({ variant = 'primary', compact = false, className = '', ...props }) {
  return (
    <button
      className={joinClasses(`${variant}-button`, compact && 'issa-button--compact', className)}
      {...props}
    />
  );
}

export function ButtonLink({ variant = 'primary', compact = false, className = '', ...props }) {
  return (
    <Link
      className={joinClasses(`${variant}-button`, compact && 'issa-button--compact', className)}
      {...props}
    />
  );
}

export function StatusBadge({ status, children, className = '' }) {
  const modifier = {
    Hadir: 'status-badge--hadir',
    Sakit: 'status-badge--sakit',
    Izin: 'status-badge--izin',
    Alfa: 'status-badge--alfa',
  }[status] || 'status-badge--neutral';

  return (
    <span className={joinClasses('status-badge', modifier, className)}>
      {children ?? status ?? 'Belum tercatat'}
    </span>
  );
}

export function Notice({ floating = false, className = '', ...props }) {
  return <div className={joinClasses('notice', floating && 'notice--floating', className)} {...props} />;
}

export function LessonRow({ to, title, meta, value, actionLabel = 'Detail' }) {
  return (
    <Link className="lesson-row" to={to}>
      <div>
        <p className="lesson-row__title">{title}</p>
        {meta && <p className="lesson-row__meta">{meta}</p>}
      </div>
      <span>
        {value !== undefined && <strong className="metric-value">{value}</strong>}
        <span className="text-link">{actionLabel}</span>
      </span>
    </Link>
  );
}

export function HistoryRecord({ title, meta, value, children, className = '' }) {
  return (
    <li className={joinClasses('history-record', className)}>
      <div>
        <p className="history-record__title">{title}</p>
        {meta && <p className="history-record__meta">{meta}</p>}
        {children}
      </div>
      {value !== undefined && <strong className="metric-value">{value}</strong>}
    </li>
  );
}
