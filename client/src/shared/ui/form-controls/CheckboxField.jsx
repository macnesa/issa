import { Checkbox } from "@headlessui/react";
import { CheckIcon } from "./form-control-icons";

export default function CheckboxField({
  id,
  label,
  checked,
  onChange,
  error,
  disabled = false,
  required = false,
  className = "",
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`issa-checkbox-field ${error ? "is-invalid" : ""} ${className}`}>
      <div className="issa-checkbox-field__row">
        <Checkbox
          as="button"
          type="button"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="issa-checkbox-field__control"
        >
          <CheckIcon className="issa-checkbox-field__icon" />
        </Checkbox>
        <label htmlFor={id} className="issa-checkbox-field__label">{label}</label>
      </div>
      {error && <p id={errorId} className="issa-checkbox-field__error" role="alert">{error}</p>}
    </div>
  );
}
