import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { DayPicker } from "@daypicker/react";
import { id as indonesianLocale } from "@daypicker/react/locale";
import { formatDateDisplay, parseLocalDateValue } from "../../../utils/recordDates";
import { CalendarChevron, CalendarIcon } from "./form-control-icons";

const calendarLabels = {
  labelNav: () => "Navigasi bulan",
  labelNext: () => "Bulan berikutnya",
  labelPrevious: () => "Bulan sebelumnya",
};

export default function DateField({
  id,
  label,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  error,
  helperText,
  disabled = false,
  required = false,
  disabledDates,
  className = "",
  tone = "attendance",
}) {
  const selectedDate = parseLocalDateValue(value);
  const labelId = `${id}-label`;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <Popover className={`issa-control-field issa-date-field issa-control-tone--${tone} ${className}`}>
      {({ close }) => (
        <>
          <label id={labelId} htmlFor={id} className="issa-control-label">{label}</label>
          <PopoverButton
            id={id}
            className="issa-date-trigger"
            disabled={disabled}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            aria-required={required}
          >
            <CalendarIcon className="issa-date-trigger__icon" />
            <span className={selectedDate ? "" : "is-placeholder"}>
              {selectedDate ? formatDateDisplay(value) : placeholder}
            </span>
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom start", gap: 6, padding: 8 }}
            portal
            focus
            className="issa-calendar-panel"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate || new Date()}
              onSelect={(date) => {
                if (!date) return;
                onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
                close();
              }}
              disabled={disabledDates}
              locale={indonesianLocale}
              labels={calendarLabels}
              components={{ Chevron: CalendarChevron }}
              classNames={calendarClassNames}
            />
          </PopoverPanel>
          {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
          {error && <p id={errorId} className="issa-control-error">{error}</p>}
        </>
      )}
    </Popover>
  );
}

export const calendarClassNames = {
  root: "issa-calendar",
  months: "issa-calendar__months",
  month: "issa-calendar__month",
  month_caption: "issa-calendar__caption",
  caption_label: "issa-calendar__caption-label",
  nav: "issa-calendar__nav",
  button_previous: "issa-calendar__nav-button issa-calendar__nav-button--previous",
  button_next: "issa-calendar__nav-button issa-calendar__nav-button--next",
  month_grid: "issa-calendar__grid",
  weekdays: "issa-calendar__weekdays",
  weekday: "issa-calendar__weekday",
  weeks: "issa-calendar__weeks",
  week: "issa-calendar__week",
  day: "issa-calendar__day",
  day_button: "issa-calendar__day-button",
  today: "is-today",
  selected: "is-selected",
  outside: "is-outside",
  disabled: "is-disabled",
  focused: "is-focused",
  hidden: "is-hidden",
  chevron: "issa-calendar__chevron",
};
