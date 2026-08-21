/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite-react/dist/components/Alert/**/*.js",
    "./node_modules/flowbite-react/dist/components/Badge/**/*.js",
    "./node_modules/flowbite-react/dist/components/Button/**/*.js",
    "./node_modules/flowbite-react/dist/components/HelperText/**/*.js",
    "./node_modules/flowbite-react/dist/components/Label/**/*.js",
    "./node_modules/flowbite-react/dist/components/Spinner/**/*.js",
    "./node_modules/flowbite-react/dist/components/TextInput/**/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        issa: {
          page: "var(--issa-page)",
          surface: "var(--issa-surface)",
          subtle: "var(--issa-surface-subtle)",
          disabled: "var(--issa-surface-disabled)",
          text: "var(--issa-text)",
          muted: "var(--issa-text-muted)",
          "text-disabled": "var(--issa-text-disabled)",
          inverse: "var(--issa-text-inverse)",
          "inverse-muted": "var(--issa-text-inverse-muted)",
          accent: "var(--issa-accent)",
          selection: "var(--issa-selection)",
          border: "var(--issa-border)",
          "border-strong": "var(--issa-border-strong)",
          success: "var(--issa-success)",
          warning: "var(--issa-warning)",
          danger: "var(--issa-danger)",
          info: "var(--issa-info)",
          focus: "var(--issa-focus)",
        },
      },
      borderRadius: {
        control: "var(--issa-radius-control)",
        surface: "var(--issa-radius-surface)",
        dialog: "var(--issa-radius-dialog)",
      },
      borderWidth: {
        emphasis: "var(--issa-border-width-emphasis)",
        accent: "0.25rem",
        option: "0.2rem",
      },
      boxShadow: {
        elevated: "var(--issa-shadow-elevated)",
        dialog: "var(--issa-shadow-dialog)",
      },
      fontSize: {
        product: "var(--issa-font-size-product)",
        eyebrow: "var(--issa-font-size-eyebrow)",
        "page-title": "var(--issa-font-size-page-title)",
        "section-title": "var(--issa-font-size-section-title)",
        body: "var(--issa-font-size-body)",
        supporting: "var(--issa-font-size-supporting)",
        label: "var(--issa-font-size-label)",
        metadata: "var(--issa-font-size-metadata)",
        table: "var(--issa-font-size-table)",
        "table-header": "var(--issa-font-size-table-header)",
        status: "var(--issa-font-size-status)",
        button: "var(--issa-font-size-button)",
      },
      maxWidth: {
        content: "var(--issa-content-max)",
      },
      width: {
        control: "var(--issa-control-height)",
      },
      height: {
        control: "var(--issa-control-height)",
      },
      minHeight: {
        control: "var(--issa-control-height)",
        "control-compact": "var(--issa-control-height-compact)",
      },
      transitionDuration: {
        fast: "var(--issa-motion-fast)",
        default: "var(--issa-motion-default)",
        slow: "var(--issa-motion-slow)",
      },
      letterSpacing: {
        title: "var(--issa-tracking-title)",
        metadata: "var(--issa-tracking-metadata)",
        product: "var(--issa-tracking-product)",
      },
      zIndex: {
        shell: "var(--issa-z-shell)",
        "dialog-backdrop": "var(--issa-z-dialog-backdrop)",
        dialog: "var(--issa-z-dialog)",
        popover: "var(--issa-z-popover)",
      },
    },
    fontFamily: {
      body: ['"Plus Jakarta Sans"', "sans-serif"],
      sans: ['"Plus Jakarta Sans"', "sans-serif"],
    },
  },
  plugins: [],
};
