import { tw } from "../tw";
import SelectField from "./SelectField";
import { ClockIcon } from "./form-control-icons";

const hourOptions = Array.from({ length: 24 }, (_, hour) => {
  const value = String(hour).padStart(2, "0");
  return { value, label: value };
});

const minuteOptions = Array.from({ length: 60 }, (_, minute) => {
  const value = String(minute).padStart(2, "0");
  return { value, label: value };
});

export default function TimeField({ id, hour, minute, onChange, disabled = false }) {
  return (
    <fieldset className={tw("issa-time-field mt-3 border-0 border-t border-issa-border pt-3", disabled && "opacity-55")} disabled={disabled}>
      <legend className={tw("issa-time-field__legend flex items-center [gap:0.38rem] text-issa-muted text-metadata font-bold tracking-metadata uppercase")}>
        <ClockIcon className={tw("issa-time-field__icon [width:0.95rem] [height:0.95rem]")} />
        Waktu lokal
      </legend>
      <div className={tw("issa-time-field__controls grid [grid-template-columns:minmax(0,_1fr)_auto_minmax(0,_1fr)] items-end [gap:0.4rem] [margin-top:0.5rem]")}>
        <SelectField
          id={`${id}-hour`}
          label="Jam"
          value={hour}
          options={hourOptions}
          placeholder="Jam"
          onChange={(nextHour) => onChange({ hour: nextHour, minute })}
          disabled={disabled}
          hideLabel
          className={tw("issa-time-field__select [&_.issa-select-trigger]:min-h-[2.4rem]")}
        />
        <span className={tw("issa-time-field__separator [padding-bottom:0.52rem] text-issa-text font-bold")} aria-hidden="true">:</span>
        <SelectField
          id={`${id}-minute`}
          label="Menit"
          value={minute}
          options={minuteOptions}
          placeholder="Menit"
          onChange={(nextMinute) => onChange({ hour, minute: nextMinute })}
          disabled={disabled}
          hideLabel
          className={tw("issa-time-field__select [&_.issa-select-trigger]:min-h-[2.4rem]")}
        />
      </div>
    </fieldset>
  );
}
