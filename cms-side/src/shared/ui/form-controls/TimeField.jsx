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
    <fieldset className="issa-time-field" disabled={disabled}>
      <legend className="issa-time-field__legend">
        <ClockIcon className="issa-time-field__icon" />
        Waktu lokal
      </legend>
      <div className="issa-time-field__controls">
        <SelectField
          id={`${id}-hour`}
          label="Jam"
          value={hour}
          options={hourOptions}
          placeholder="Jam"
          onChange={(nextHour) => onChange({ hour: nextHour, minute })}
          disabled={disabled}
          hideLabel
          className="issa-time-field__select"
        />
        <span className="issa-time-field__separator" aria-hidden="true">:</span>
        <SelectField
          id={`${id}-minute`}
          label="Menit"
          value={minute}
          options={minuteOptions}
          placeholder="Menit"
          onChange={(nextMinute) => onChange({ hour, minute: nextMinute })}
          disabled={disabled}
          hideLabel
          className="issa-time-field__select"
        />
      </div>
    </fieldset>
  );
}
