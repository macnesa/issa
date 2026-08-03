import { tw } from "../tw";
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
import { fieldMessageClasses, triggerClasses } from "./controlStyles";

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
    <Popover className={tw(`issa-control-field min-w-0 issa-date-time-field issa-control-tone--${tone} ${className}`)}>
      {({ close }) => (
        <>
          <label id={labelId} htmlFor={id} className={tw(`issa-control-label block mb-1 text-issa-text text-label font-semibold ${hideLabel ? "sr-only" : ""}`)}>
            {label}
            {optional && <span className={tw("issa-control-label__optional ml-2 text-issa-muted text-metadata font-medium tracking-metadata uppercase")}>Opsional</span>}
          </label>
          <PopoverButton
            id={id}
            className={tw(triggerClasses, "issa-date-trigger justify-start")}
            disabled={disabled}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          >
            <CalendarIcon className={tw("issa-date-trigger__icon [width:1.05rem] [height:1.05rem] flex-none text-issa-accent")} />
            <span className={tw(!parsedValue && "is-placeholder text-issa-muted")}>
              {parsedValue ? formatDateTimeDisplay(value) : placeholder}
            </span>
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom start", gap: 6, padding: 8 }}
            portal
            focus
            className={tw("issa-calendar-panel z-popover [width:min(21rem,_calc(100vw_-_1rem))] [max-height:var(--anchor-max-height)] overflow-auto border border-issa-border-strong rounded-dialog bg-issa-surface p-3 shadow-dialog outline-none max-sm:p-2 issa-date-time-panel [width:min(22rem,_calc(100vw_-_1rem))]")}
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
            <div className={tw("issa-date-time-panel__actions flex justify-end [gap:0.5rem] [margin-top:0.75rem] border-t border-issa-border [padding-top:0.75rem]")}>
              {optional && value && (
                <button type="button" className={tw("issa-calendar-action issa-calendar-action--clear min-h-9 rounded-control border border-issa-border-strong bg-issa-surface px-3 py-1.5 text-metadata font-bold text-issa-text disabled:cursor-not-allowed disabled:opacity-50")} onClick={() => onChange("")}>
                  Kosongkan
                </button>
              )}
              <button type="button" className={tw("issa-calendar-action min-h-9 rounded-control border border-issa-accent bg-issa-accent px-3 py-1.5 text-metadata font-bold text-issa-inverse disabled:cursor-not-allowed disabled:opacity-50")} onClick={() => close()} disabled={!selectedDate}>
                Selesai
              </button>
            </div>
          </PopoverPanel>
          {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
          {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
        </>
      )}
    </Popover>
  );
}
