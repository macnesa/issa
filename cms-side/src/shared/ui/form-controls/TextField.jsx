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
    <div className={`issa-control-field ${className}`}>
      <label className="issa-control-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="issa-native-control"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
      {error && <p id={errorId} className="issa-control-error">{error}</p>}
    </div>
  );
}
