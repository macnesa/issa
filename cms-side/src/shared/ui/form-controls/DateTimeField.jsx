import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { DayPicker } from "@daypicker/react";
import { id as indonesianLocale } from "@daypicker/react/locale";
import {
  formatDateTimeDisplay,
  localDateTimeValue,
  parseLocalDateTimeValue,
} from "../../../utils/recordDates";
import { CalendarChevron, CalendarIcon } from "./form-control-icons";
import TimeField from "./TimeField";
import { calendarClassNames } from "./DateField";

const calendarLabels = {
  labelNav: () => "Navigasi bulan",
  labelNext: () => "Bulan berikutnya",
  labelPrevious: () => "Bulan sebelumnya",
};

export default function DateTimeField({
  id,
  label,
  value,
  onChange,
  placeholder = "Pilih tanggal dan waktu",
  error,
  helperText,
  disabled = false,
  optional = false,
  hideLabel = false,
  className = "",
  tone = "feedback",
}) {
  const parsedValue = parseLocalDateTimeValue(value);
  const selectedDate = parsedValue?.date;
  const hour = parsedValue?.hour || "";
  const minute = parsedValue?.minute || "";
  const labelId = `${id}-label`;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  function handleDateSelect(date) {
    if (!date) return;
    const now = new Date();
    onChange(localDateTimeValue(
      date,
      parsedValue?.hour || String(now.getHours()).padStart(2, "0"),
      parsedValue?.minute || String(now.getMinutes()).padStart(2, "0"),
    ));
  }

  function handleTimeChange(nextTime) {
    if (!selectedDate) return;
    onChange(localDateTimeValue(selectedDate, nextTime.hour, nextTime.minute));
  }

  return (
    <Popover className={`issa-control-field issa-date-time-field issa-control-tone--${tone} ${className}`}>
      {({ close }) => (
        <>
          <label id={labelId} htmlFor={id} className={`issa-control-label ${hideLabel ? "sr-only" : ""}`}>
            {label}
            {optional && <span className="issa-control-label__optional">Opsional</span>}
          </label>
          <PopoverButton
            id={id}
            className="issa-date-trigger"
            disabled={disabled}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          >
            <CalendarIcon className="issa-date-trigger__icon" />
            <span className={parsedValue ? "" : "is-placeholder"}>
              {parsedValue ? formatDateTimeDisplay(value) : placeholder}
            </span>
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom start", gap: 6, padding: 8 }}
            portal
            focus
            className="issa-calendar-panel issa-date-time-panel"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate || new Date()}
              onSelect={handleDateSelect}
              locale={indonesianLocale}
              labels={calendarLabels}
              components={{ Chevron: CalendarChevron }}
              classNames={calendarClassNames}
            />
            <TimeField
              id={`${id}-time`}
              hour={hour}
              minute={minute}
              onChange={handleTimeChange}
              disabled={!selectedDate}
            />
            <div className="issa-date-time-panel__actions">
              {optional && value && (
                <button type="button" className="issa-calendar-action issa-calendar-action--clear" onClick={() => onChange("")}>
                  Kosongkan
                </button>
              )}
              <button type="button" className="issa-calendar-action" onClick={() => close()} disabled={!selectedDate}>
                Selesai
              </button>
            </div>
          </PopoverPanel>
          {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
          {error && <p id={errorId} className="issa-control-error">{error}</p>}
        </>
      )}
    </Popover>
  );
}
