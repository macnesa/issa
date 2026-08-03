import { tw } from "../tw";
export function ChevronIcon({ className = "", orientation = "down" }) {
  const rotation = { up: 180, right: -90, left: 90, down: 0 }[orientation] || 0;
  return (
    <svg className={tw(className)} viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)` }}>
      <path d="m5.5 7.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = "" }) {
  return (
    <svg className={tw(className)} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m3.5 9.1 3.25 3.15 7.75-7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className = "" }) {
  return (
    <svg className={tw(className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.25 2.75v2.5M14.75 2.75v2.5M3 7.25h14M4.25 4h11.5A1.25 1.25 0 0 1 17 5.25v11A1.25 1.25 0 0 1 15.75 17H4.25A1.25 1.25 0 0 1 3 15.75V5.25A1.25 1.25 0 0 1 4.25 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M6.5 13.5h.01M10 13.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className = "" }) {
  return (
    <svg className={tw(className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.25V10l2.75 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ className = "" }) {
  return (
    <svg className={tw(className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.7 12.7 3.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarChevron({ className = "", orientation = "left", size = 20, disabled = false, style }) {
  return (
    <ChevronIcon
      className={tw(className)}
      orientation={orientation}
      style={style}
      width={size}
      height={size}
      aria-disabled={disabled}
    />
  );
}
