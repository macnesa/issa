import { tw } from "../tw";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { DayPicker } from "@daypicker/react";
import { id as indonesianLocale } from "@daypicker/react/locale";
import { formatDateDisplay, parseLocalDateValue } from "../../../utils/recordDates";
import { CalendarChevron, CalendarIcon } from "./form-control-icons";
import { fieldMessageClasses, triggerClasses } from "./controlStyles";

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
    <Popover className={tw(`issa-control-field min-w-0 issa-date-field issa-control-tone--${tone} ${className}`)}>
      {({ close }) => (
        <>
          <label id={labelId} htmlFor={id} className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")}>{label}</label>
          <PopoverButton
            id={id}
            className={tw(triggerClasses, "issa-date-trigger justify-start")}
            disabled={disabled}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            aria-required={required}
          >
            <CalendarIcon className={tw("issa-date-trigger__icon [width:1.05rem] [height:1.05rem] flex-none text-issa-accent")} />
            <span className={tw(!selectedDate && "is-placeholder text-issa-muted")}>
              {selectedDate ? formatDateDisplay(value) : placeholder}
            </span>
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom start", gap: 6, padding: 8 }}
            portal
            focus
            className={tw("issa-calendar-panel z-popover [width:min(21rem,_calc(100vw_-_1rem))] [max-height:var(--anchor-max-height)] overflow-auto border border-issa-border-strong rounded-dialog bg-issa-surface p-3 shadow-dialog outline-none max-sm:p-2")}
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
          {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
          {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
        </>
      )}
    </Popover>
  );
}

export const calendarClassNames = {
  root: tw("issa-calendar [--calendar-cell:2.35rem] relative text-issa-text max-sm:[--calendar-cell:min(_______var(--issa-control-height-compact),_______calc((100vw_-_3rem)_/_7)_____)]"),
  months: tw("issa-calendar__months"),
  month: tw("issa-calendar__month"),
  month_caption: tw("issa-calendar__caption relative flex [min-height:2.4rem] items-center justify-center border-b border-issa-border [margin-bottom:0.45rem] [padding-bottom:0.45rem]"),
  caption_label: tw("issa-calendar__caption-label text-issa-text text-body font-bold [text-transform:capitalize]"),
  nav: tw("issa-calendar__nav absolute top-0 right-0 left-0 flex justify-between pointer-events-none"),
  button_previous: tw("issa-calendar__nav-button issa-calendar__nav-button--previous pointer-events-auto grid h-9 w-9 place-items-center rounded-control border border-issa-border-strong bg-issa-subtle text-issa-accent enabled:hover:bg-[color-mix(in_srgb,var(--issa-selection)_18%,var(--issa-surface))] focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:opacity-40"),
  button_next: tw("issa-calendar__nav-button issa-calendar__nav-button--next pointer-events-auto grid h-9 w-9 place-items-center rounded-control border border-issa-border-strong bg-issa-subtle text-issa-accent enabled:hover:bg-[color-mix(in_srgb,var(--issa-selection)_18%,var(--issa-surface))] focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus disabled:opacity-40"),
  month_grid: tw("issa-calendar__grid w-full border-collapse"),
  weekdays: tw("issa-calendar__weekdays"),
  weekday: tw("issa-calendar__weekday h-8 text-issa-muted text-metadata font-bold text-center uppercase"),
  weeks: tw("issa-calendar__weeks"),
  week: tw("issa-calendar__week"),
  day: tw("issa-calendar__day [width:var(--calendar-cell)] [height:var(--calendar-cell)] [padding:0.12rem] text-center"),
  day_button: tw("issa-calendar__day-button grid w-full h-full place-items-center border border-transparent rounded-control bg-transparent text-inherit text-supporting outline-none focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-1 focus-visible:outline-issa-focus"),
  today: tw("is-today"),
  selected: tw("is-selected"),
  outside: tw("is-outside"),
  disabled: tw("is-disabled"),
  focused: tw("is-focused"),
  hidden: tw("is-hidden"),
  chevron: tw("issa-calendar__chevron w-4 h-4"),
};
