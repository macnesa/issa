import { createTheme } from "flowbite-react/helpers/create-theme";

export const issaFlowbiteApplyTheme = {
  alert: "replace",
  modal: "replace",
  pagination: "replace",
  table: "replace",
};

export const issaFlowbiteTheme = createTheme({
  button: {
    base: "issa-button inline-flex items-center justify-center gap-2 rounded-control border border-transparent text-center font-bold leading-tight transition-[background-color,border-color,color,box-shadow,transform] duration-default enabled:active:translate-x-px enabled:active:translate-y-px enabled:active:shadow-none focus:ring-0 focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:border-issa-border disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:shadow-none motion-reduce:transition-none",
    disabled: "pointer-events-none opacity-100",
    size: {
      xs: "h-auto min-h-control-compact px-3 text-xs",
      sm: "h-auto min-h-control-compact px-3 py-1 text-metadata",
      md: "h-auto min-h-control px-4 py-2 text-button",
      lg: "h-auto min-h-control px-5 text-base",
      xl: "h-auto min-h-control px-6 text-base",
      login: "h-auto min-h-[2.8rem] px-4 py-2.5 text-[0.8rem]",
    },
    color: {
      primary: "border-issa-text bg-issa-accent text-issa-inverse enabled:hover:bg-issa-text",
      secondary: "border-issa-border-strong bg-issa-surface text-issa-text enabled:hover:border-issa-accent enabled:hover:bg-issa-subtle",
      tertiary: "border-transparent bg-transparent text-issa-accent enabled:hover:bg-issa-subtle enabled:hover:text-issa-text",
      destructive: "border-issa-danger bg-issa-danger text-issa-inverse enabled:hover:bg-[color-mix(in_srgb,var(--issa-danger)_84%,black)] focus-visible:outline-[color-mix(in_srgb,var(--issa-danger)_38%,var(--issa-surface))]",
      login: "!rounded-[0.08rem] border-2 border-[#173e52] bg-[#245b70] font-extrabold uppercase tracking-[0.12em] text-issa-inverse shadow-[0.12rem_0.14rem_0_#88a5ae] enabled:hover:bg-[#173e52] disabled:opacity-60",
      loginSecondary: "!rounded-[0.08rem] border-2 border-[#245b70] bg-transparent font-extrabold uppercase tracking-[0.1em] text-[#245b70] enabled:hover:bg-[#e8f4f2] disabled:opacity-60",
    },
  },
  badge: {
    root: {
      base: "inline-flex h-fit items-center gap-1 rounded-full border border-current px-2 py-1 text-status font-semibold leading-tight",
      color: {
        issaNeutral: "bg-issa-subtle text-issa-muted",
        issaSuccess: "bg-[color-mix(in_srgb,var(--issa-success)_10%,var(--issa-surface))] text-issa-success",
        issaWarning: "bg-[color-mix(in_srgb,var(--issa-warning)_10%,var(--issa-surface))] text-issa-warning",
        issaDanger: "bg-[color-mix(in_srgb,var(--issa-danger)_10%,var(--issa-surface))] text-issa-danger",
        issaInfo: "bg-[color-mix(in_srgb,var(--issa-info)_10%,var(--issa-surface))] text-issa-info",
        issaAttention: "bg-[color-mix(in_srgb,var(--issa-selection)_10%,var(--issa-surface))] text-issa-accent",
      },
      size: {
        xs: "issa-badge-size",
        sm: "issa-badge-size",
        issa: "issa-badge-size",
      },
    },
    icon: {
      off: "issa-badge-without-icon rounded-full px-2 py-1",
      on: "issa-badge-with-icon",
    },
  },
  textInput: {
    base: "flex w-full",
    field: {
      base: "relative w-full",
      input: {
        base: "issa-native-control block w-full min-w-0 rounded-control border bg-issa-surface text-body text-issa-text transition-[border-color,background-color,box-shadow] duration-fast placeholder:text-issa-muted placeholder:opacity-100 enabled:hover:border-issa-accent focus:outline-none focus:ring-0 focus-visible:border-issa-accent focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus focus-visible:[box-shadow:inset_var(--issa-border-width-emphasis)_0_0_var(--issa-selection)] aria-[invalid=true]:border-issa-danger aria-[invalid=true]:bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))] disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:opacity-100 motion-reduce:transition-none",
        sizes: {
          sm: "min-h-control-compact px-3 py-2 text-supporting",
          md: "min-h-control px-3 py-2 text-body",
          lg: "min-h-control px-4 py-3 text-base",
        },
        colors: {
          gray: "border-issa-border-strong focus:border-issa-accent",
          info: "border-issa-info focus:border-issa-info",
          success: "border-issa-success focus:border-issa-success",
          warning: "border-issa-warning focus:border-issa-warning",
          failure: "border-issa-danger focus:border-issa-danger",
        },
        withAddon: {
          on: "rounded-control",
          off: "rounded-control",
        },
        withShadow: {
          on: "shadow-elevated",
          off: "",
        },
      },
    },
  },
  textarea: {
    base: "issa-native-control issa-native-control--textarea block min-h-control w-full min-w-0 rounded-control border bg-issa-surface px-3 py-2 text-body text-issa-text transition-[border-color,background-color,box-shadow] duration-fast placeholder:text-issa-muted placeholder:opacity-100 enabled:hover:border-issa-accent focus:outline-none focus:ring-0 focus-visible:border-issa-accent focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus focus-visible:[box-shadow:inset_var(--issa-border-width-emphasis)_0_0_var(--issa-selection)] aria-[invalid=true]:border-issa-danger aria-[invalid=true]:bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))] disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:opacity-100 motion-reduce:transition-none",
    colors: {
      gray: "border-issa-border-strong",
      info: "border-issa-info",
      success: "border-issa-success",
      warning: "border-issa-warning",
      failure: "border-issa-danger",
    },
    withShadow: {
      on: "shadow-elevated",
      off: "",
    },
  },
  label: {
    root: {
      base: "block mb-1 text-label font-semibold",
      disabled: "text-issa-text-disabled opacity-100",
      colors: {
        default: "text-issa-text",
        info: "text-issa-info",
        success: "text-issa-success",
        warning: "text-issa-warning",
        failure: "text-issa-danger",
      },
    },
  },
  helperText: {
    root: {
      base: "mt-1 text-metadata leading-normal",
      colors: {
        gray: "text-issa-muted",
        info: "text-issa-info",
        success: "text-issa-success",
        warning: "text-issa-warning",
        failure: "text-issa-danger",
      },
    },
  },
  checkbox: {
    base: "issa-checkbox h-4 w-4 flex-none appearance-none rounded-[0.2rem] border border-issa-border-strong bg-issa-surface bg-[length:0.55em_0.55em] bg-center bg-no-repeat checked:border-transparent checked:bg-current checked:bg-check-icon focus:outline-none focus:ring-0 focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:opacity-100",
    color: {
      issa: "text-issa-accent",
    },
    indeterminate: "border-transparent bg-current bg-dash-icon",
  },
  radio: {
    base: "issa-radio h-4 w-4 flex-none appearance-none rounded-full border border-issa-border-strong bg-issa-surface bg-[length:1em_1em] bg-center bg-no-repeat checked:border-transparent checked:bg-current checked:bg-dot-icon focus:outline-none focus:ring-0 focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:opacity-100",
    color: {
      issa: "text-issa-accent",
    },
  },
  fileInput: {
    base: "issa-file-input block min-h-control w-full cursor-pointer rounded-control border bg-issa-surface text-body text-issa-text file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-issa-border-strong file:bg-issa-subtle file:px-3 file:py-2 file:text-button file:font-bold file:text-issa-text hover:file:bg-[color-mix(in_srgb,var(--issa-selection)_16%,var(--issa-surface))] focus:outline-none focus:ring-0 focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:opacity-100 disabled:file:cursor-not-allowed",
    sizes: {
      issa: "text-body",
    },
    colors: {
      issa: "border-issa-border-strong",
      failure: "border-issa-danger bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))]",
    },
  },
  alert: {
    base: "flex flex-col gap-2 rounded-surface border border-issa-border border-l-accent bg-issa-subtle p-4 text-supporting",
    borderAccent: "border-l-accent",
    color: {
      gray: "border-issa-border-strong border-l-issa-border-strong text-issa-muted",
      info: "border-issa-info border-l-issa-info text-issa-info",
      success: "border-issa-success border-l-issa-success text-issa-success",
      warning: "border-issa-warning border-l-issa-warning text-issa-warning",
      failure: "border-issa-danger border-l-issa-danger bg-[color-mix(in_srgb,var(--issa-danger)_8%,var(--issa-surface))] text-issa-danger",
    },
    closeButton: {
      base: "ml-auto inline-flex min-h-control-compact min-w-control-compact items-center justify-center rounded-control focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus",
      color: {
        gray: "text-issa-muted hover:bg-issa-surface",
        info: "text-issa-info hover:bg-issa-surface",
        success: "text-issa-success hover:bg-issa-surface",
        warning: "text-issa-warning hover:bg-issa-surface",
        failure: "text-issa-danger hover:bg-issa-surface",
      },
      icon: "h-5 w-5",
    },
    icon: "h-5 w-5 flex-none",
    rounded: "rounded-surface",
    wrapper: "flex min-w-0 items-start",
  },
  spinner: {
    base: "inline animate-spin text-issa-border",
    color: {
      default: "fill-issa-accent",
      info: "fill-issa-info",
      success: "fill-issa-success",
      warning: "fill-issa-warning",
      failure: "fill-issa-danger",
    },
  },
  modal: {
    root: {
      base: "issa-dialog-backdrop fixed inset-0 z-dialog overflow-y-auto overflow-x-hidden p-4 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both]",
      show: {
        on: "flex",
        off: "hidden",
      },
      sizes: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        issaCompact: "max-w-[32rem]",
        issaWide: "max-w-[42rem]",
        issaWorkspace: "max-w-[58rem]",
      },
      positions: {
        "top-left": "items-start justify-start",
        "top-center": "items-start justify-center",
        "top-right": "items-start justify-end",
        "center-left": "items-center justify-start",
        center: "items-center justify-center",
        "center-right": "items-center justify-end",
        "bottom-right": "items-end justify-end",
        "bottom-center": "items-end justify-center",
        "bottom-left": "items-end justify-start",
      },
    },
    content: {
      base: "issa-dialog-container relative w-full outline-none",
      inner: "issa-dialog-panel relative flex max-h-[calc(100dvh_-_var(--issa-space-8))] flex-col overflow-hidden rounded-dialog border border-issa-border-strong bg-issa-surface shadow-dialog [animation:issa-dialog-panel-in_var(--issa-motion-slow)_ease_both]",
    },
    body: {
      base: "issa-dialog-body flex-1 overflow-y-auto overflow-x-hidden p-4 text-body text-issa-text",
      popup: "p-4",
    },
    header: {
      base: "issa-dialog-header flex items-start justify-between gap-4 border-b border-issa-border p-4",
      popup: "border-b border-issa-border p-4",
      title: "issa-dialog-title text-section-title font-bold leading-tight text-issa-text",
      close: {
        base: "hidden",
        icon: "h-5 w-5",
      },
    },
    footer: {
      base: "issa-dialog-footer flex flex-wrap justify-end gap-2 border-t border-issa-border p-4",
      popup: "border-t border-issa-border",
    },
  },
  table: {
    root: {
      base: "w-full border-collapse text-left text-table text-issa-text",
      shadow: "hidden",
      wrapper: "relative",
    },
    body: {
      base: "group/body",
      cell: {
        base: "p-3",
      },
    },
    head: {
      base: "group/head bg-issa-subtle text-table-header uppercase tracking-metadata text-issa-muted",
      cell: {
        base: "bg-issa-subtle p-3 font-bold whitespace-nowrap",
      },
    },
    row: {
      base: "group/row border-t border-issa-border bg-issa-surface align-top text-issa-text transition-colors duration-fast motion-reduce:transition-none",
      hovered: "hover:bg-issa-subtle",
      striped: "",
    },
  },
  pagination: {
    base: "min-w-0",
    layout: {
      table: {
        base: "text-supporting text-issa-muted",
        span: "font-semibold text-issa-text",
      },
    },
    pages: {
      base: "m-0 inline-flex items-center gap-3 p-0 max-sm:grid max-sm:grid-cols-2",
      showIcon: "inline-flex",
      previous: {
        base: "issa-pagination-button min-h-control-compact rounded-control border border-issa-border-strong bg-issa-surface px-3 py-1 text-button font-bold leading-tight text-issa-text transition-colors duration-default enabled:hover:border-issa-accent enabled:hover:bg-issa-subtle focus:outline-none focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:border-issa-border disabled:bg-issa-disabled disabled:text-issa-text-disabled motion-reduce:transition-none",
        icon: "h-5 w-5",
      },
      next: {
        base: "issa-pagination-button min-h-control-compact rounded-control border border-issa-border-strong bg-issa-surface px-3 py-1 text-button font-bold leading-tight text-issa-text transition-colors duration-default enabled:hover:border-issa-accent enabled:hover:bg-issa-subtle focus:outline-none focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:cursor-not-allowed disabled:border-issa-border disabled:bg-issa-disabled disabled:text-issa-text-disabled motion-reduce:transition-none",
        icon: "h-5 w-5",
      },
      selector: {
        base: "min-h-control-compact border border-issa-border-strong bg-issa-surface px-3 py-1 text-button font-bold text-issa-text",
        active: "bg-issa-text text-issa-inverse",
        disabled: "cursor-not-allowed bg-issa-disabled text-issa-text-disabled",
      },
    },
  },
});
