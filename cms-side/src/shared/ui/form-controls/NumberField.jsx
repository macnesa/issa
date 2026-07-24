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
    <div className={`issa-control-field issa-number-field ${className}`}>
      <label className={`issa-control-label ${hideLabel ? "sr-only" : ""}`} htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="issa-native-control issa-number-control"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
      {error && <p id={errorId} className="issa-control-error">{error}</p>}
    </div>
  );
}
