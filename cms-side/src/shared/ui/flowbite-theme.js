import { createTheme } from "flowbite-react/helpers/create-theme";

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
      input: {
        base: "block w-full rounded-control border bg-issa-surface text-issa-text placeholder-issa-text-muted transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-issa-focus disabled:cursor-not-allowed disabled:bg-issa-disabled disabled:text-issa-text-disabled disabled:opacity-100",
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
      },
    },
  },
  label: {
    root: {
      base: "text-label font-semibold",
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
      base: "mt-2 text-supporting",
      colors: {
        gray: "text-issa-text-muted",
        info: "text-issa-info",
        success: "text-issa-success",
        warning: "text-issa-warning",
        failure: "text-issa-danger",
      },
    },
  },
  alert: {
    base: "flex flex-col gap-2 rounded-surface border-l-accent bg-issa-subtle p-4 text-supporting",
    color: {
      info: "border-issa-info text-issa-info",
      success: "border-issa-success text-issa-success",
      warning: "border-issa-warning text-issa-warning",
      failure: "border-issa-danger text-issa-danger",
      error: "border-issa-danger text-issa-danger",
    },
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
});
