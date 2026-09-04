import { tw } from "./tw";

function IconGlyph({ name }) {
  switch (name) {
    case "today":
      return <>
        <rect x="3" y="5" width="18" height="16" rx="1.5" />
        <path d="M7 3v4M17 3v4M3 10h18" />
        <path d="M8 14h8M8 17h5" />
      </>;
    case "group":
      return <>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16.5" cy="10" r="2.5" />
        <path d="M3.5 19c.5-3.4 2.3-5.2 5.5-5.2s5 1.8 5.5 5.2M14 14.3c3.5-.4 5.6 1.2 6.2 4.7" />
      </>;
    case "school":
      return <>
        <path d="m3 9 9-5 9 5-9 5z" />
        <path d="M6 11.5V17c3.8 2.3 8.2 2.3 12 0v-5.5M21 9v6" />
      </>;
    case "add":
      return <path d="M12 5v14M5 12h14" />;
    case "chevron_right":
      return <path d="m9 6 6 6-6 6" />;
    case "arrow_back":
      return <path d="M19 12H5M10 7l-5 5 5 5" />;
    case "dashboard":
      return <>
        <rect x="3.5" y="3.5" width="6.5" height="6.5" />
        <rect x="14" y="3.5" width="6.5" height="6.5" />
        <rect x="3.5" y="14" width="6.5" height="6.5" />
        <rect x="14" y="14" width="6.5" height="6.5" />
      </>;
    case "fact_check":
      return <>
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="m6.5 9 1.5 1.5L11 7.5M14 9h4M6.5 15 8 16.5l3-3M14 15h4" />
      </>;
    case "calendar_month":
    case "event":
      return <>
        <rect x="3" y="5" width="18" height="16" rx="1.5" />
        <path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2" />
      </>;
    case "account_circle":
      return <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="9" r="3" />
        <path d="M6.5 19c.8-3 2.6-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
      </>;
    case "logout":
      return <>
        <path d="M10 4H5v16h5M13 8l4 4-4 4M8 12h9" />
      </>;
    case "search":
      return <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4.5 4.5" />
      </>;
    case "expand_more":
      return <path d="m7 9.5 5 5 5-5" />;
    case "close":
      return <path d="M6 6l12 12M18 6 6 18" />;
    case "person":
      return <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" />
      </>;
    case "forum":
      return <>
        <path d="M4 4h16v11H9l-5 4v-4H4z" />
        <path d="M8 8h8M8 11h5" />
      </>;
    case "cloud_done":
      return <>
        <path d="M7.5 18H6a4 4 0 0 1-.5-8A6.5 6.5 0 0 1 18 9.5a4.25 4.25 0 0 1 0 8.5h-1.5" />
        <path d="m9 15 2 2 4-4" />
      </>;
    case "schedule":
      return <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>;
    case "manage_search":
      return <>
        <path d="M4 6h9M4 11h6M4 16h5" />
        <circle cx="15.5" cy="15.5" r="3.5" />
        <path d="m18 18 3 3" />
      </>;
    case "cloud_off":
      return <>
        <path d="M5 5 19 19M8 18H6a4 4 0 0 1-1-7.9M7 7.3A6.5 6.5 0 0 1 18 10a4.25 4.25 0 0 1 2 6.7" />
      </>;
    case "arrow_forward":
      return <path d="M5 12h14M14 7l5 5-5 5" />;
    case "auto_stories":
      return <>
        <path d="M3.5 5.5c3.5-.7 6.3.1 8.5 2.2v11c-2.2-2.1-5-2.9-8.5-2.2zM20.5 5.5c-3.5-.7-6.3.1-8.5 2.2v11c2.2-2.1 5-2.9 8.5-2.2z" />
      </>;
    case "rate_review":
      return <>
        <path d="M4 4h16v13H9l-5 4z" />
        <path d="M8 8h8M8 12h5" />
      </>;
    case "menu_book":
      return <>
        <path d="M3.5 5.5c3.5-.7 6.3.1 8.5 2.2v11c-2.2-2.1-5-2.9-8.5-2.2zM20.5 5.5c-3.5-.7-6.3.1-8.5 2.2v11c2.2-2.1 5-2.9 8.5-2.2z" />
        <path d="M7 10h2.5M14.5 10H17" />
      </>;
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}

export default function Icon({
  name,
  className = "",
  title,
  ...props
}) {
  return (
    <svg
      className={tw(`issa-icon inline-block h-[1em] w-[1em] flex-none align-middle ${className}`)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      {...props}
    >
      {title && <title>{title}</title>}
      <IconGlyph name={name} />
    </svg>
  );
}
