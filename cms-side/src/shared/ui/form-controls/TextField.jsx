import { tw } from "../tw";
import { fieldMessageClasses, nativeControlClasses } from "./controlStyles";
export default function TextField({
  id,
  label,
  error,
  helperText,
  className = "",
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={tw(`issa-control-field min-w-0 ${className}`)}>
      <label className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={tw(nativeControlClasses, "px-3 py-2")}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
      {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
    </div>
  );
}
