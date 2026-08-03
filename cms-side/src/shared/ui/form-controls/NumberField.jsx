import { tw } from "../tw";
import { fieldMessageClasses, nativeControlClasses } from "./controlStyles";
export default function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  hideLabel = false,
  className = "",
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={tw(`issa-control-field min-w-0 issa-number-field ${className}`)}>
      <label className={tw(`issa-control-label block mb-1 text-issa-text text-label font-semibold ${hideLabel ? "sr-only" : ""}`)} htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={tw(nativeControlClasses, "issa-number-control appearance-none px-3 py-2 [-moz-appearance:textfield]")}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
      {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
    </div>
  );
}
