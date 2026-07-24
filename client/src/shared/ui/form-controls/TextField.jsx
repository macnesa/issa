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
    <div className={`issa-text-field ${className}`}>
      <label htmlFor={id} className="issa-text-field__label">{label}</label>
      <input
        id={id}
        className="issa-text-field__input"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {helperText && <p id={helperId} className="issa-text-field__helper">{helperText}</p>}
      {error && <p id={errorId} className="issa-text-field__error">{error}</p>}
    </div>
  );
}
