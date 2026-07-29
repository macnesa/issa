# Institutional Ledger System

This document is the source-of-truth contract for authenticated CMS chrome and
administrative record surfaces. It combines the structural discipline of the
Teacher shell with the compact treatment of the Scores ledger.

## Semantic token contract

`src/index.css` owns the canonical token values. Shared and migrated feature
styles consume tokens and do not introduce route palettes.

- Color: `--issa-page`, `--issa-surface`, `--issa-surface-subtle`,
  `--issa-text`, `--issa-text-muted`, `--issa-accent`, `--issa-border`,
  `--issa-border-strong`, `--issa-success`, `--issa-warning`,
  `--issa-danger`, `--issa-info`, `--issa-focus`.
- Geometry: control `0.25rem`, surface `0.375rem`, dialog `0.5rem`, and
  status-only pill `999px`.
- Borders: default `1px` and emphasis `2px`.
- Shadows: no default surface shadow; one restrained hard-offset elevated
  shadow and one soft dialog/popover shadow.
- Spacing: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, and
  `3rem`.
- Width: `PageContainer` owns an authenticated content maximum of `80rem`.
  Route utilities must not override it.
- Breakpoints: new shared and migrated structures use `640px`, `768px`,
  `1024px`, and `1280px`. The compact Teacher shell remains below `1024px`.

Legacy aliases in `src/index.css` exist only so unmigrated Prompt 2 routes keep
working. New shared code uses `--issa-*` names.

## Typography roles

The system font stack remains authoritative. Shared tokens define product
identity, page eyebrow, page title, section title, body, supporting body, form
label, metadata, table header, table body, status, and button roles. Uppercase
tracking is limited to identity, compact metadata, and table headings.

## CSS ownership

Shared CSS owns tokens, page/container rules, typography roles, surfaces,
buttons, form-control visuals, status visuals, student context, workspace tabs,
ledger boundaries, and the dialog foundation. Dialogs use the shared backdrop,
surface, radius, shadow, z-index, and spacing tokens.

Feature CSS may own domain grids, row structure, placement, and necessary
responsive structure. It must not replace shared color, radius, shadow, button,
control, status, or page typography systems. It may size a shared component for
placement, but must not restyle the component internals.

## Primitive contract

- `PageContainer`: authenticated width, gutters, and page rhythm.
- `PageHeader`: eyebrow, title, description, optional metadata and actions.
- `Surface`: `default`, `subtle`, and `emphasized`.
- Buttons: primary, secondary, tertiary, and destructive; shared disabled,
  focus, compact, and loading behavior.
- `StatusBadge`: success, warning, danger, info, and neutral semantics.
- Form controls: shared height, border, radius, text, placeholder, focus,
  disabled, and error treatment.
- `StudentContextHeader`: photo/fallback, name, non-breaking NIM, factual class,
  optional metadata and actions.
- `WorkspaceTabs`: tab semantics, roving keyboard focus, active state, and
  horizontal overflow.
- `WorkspacePanel`: linked tabpanel semantics and immediate workspace frame.
- `LedgerShell`: domain-neutral outer ledger, heading, states, dividers, and
  overflow boundary.

## Completed migration

Dashboard, Attendance, Schedule, the five Student Detail workspaces, Journal,
Evidence, Feedback, AI drafting, and the active dialog surfaces now consume this
contract. Their feature styles own only domain layout and content arrangement.

The authenticated responsive system uses the canonical `640px`, `768px`,
`1024px`, and `1280px` thresholds. Login remains intentionally unchanged.

`App.css` and `features/authentication/teacher-login.css` were removed after
their import graphs were reconfirmed empty. DaisyUI and Flowbite were likewise
removed after the active CMS source graph proved that neither framework had a
consumer.
