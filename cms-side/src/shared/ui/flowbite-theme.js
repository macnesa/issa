import { createTheme } from "flowbite-react/helpers/create-theme";

export const issaFlowbiteTheme = createTheme({
  button: {
    base: "relative inline-flex items-center justify-center gap-2 rounded-control border text-center font-semibold transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-issa-focus focus:ring-offset-2 focus:ring-offset-issa-surface",
    disabled: "pointer-events-none cursor-not-allowed opacity-50",
    size: {
      xs: "min-h-control-compact px-3 text-xs",
      sm: "min-h-control-compact px-3 text-button",
      md: "min-h-control px-4 text-button",
      lg: "min-h-control px-5 text-base",
      xl: "min-h-control px-6 text-base",
    },
    color: {
      primary: "border-issa-accent bg-issa-accent text-issa-inverse hover:border-issa-text hover:bg-issa-text focus:ring-issa-focus",
      secondary: "border-issa-border-strong bg-issa-surface text-issa-text hover:bg-issa-subtle focus:ring-issa-focus",
      tertiary: "border-transparent bg-transparent text-issa-accent hover:bg-issa-subtle focus:ring-issa-focus",
      destructive: "border-issa-danger bg-issa-danger text-issa-inverse hover:brightness-90 focus:ring-issa-focus",
    },
  },
  badge: {
    root: {
      base: "inline-flex h-fit items-center gap-1 rounded-full border px-2 py-0.5 text-status font-semibold",
      color: {
        neutral: "border-issa-border-strong bg-issa-subtle text-issa-text-muted",
        success: "border-issa-success bg-issa-surface text-issa-success",
        warning: "border-issa-warning bg-issa-surface text-issa-warning",
        error: "border-issa-danger bg-issa-surface text-issa-danger",
        info: "border-issa-info bg-issa-surface text-issa-info",
        attention: "border-issa-selection bg-issa-subtle text-issa-accent",
      },
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
