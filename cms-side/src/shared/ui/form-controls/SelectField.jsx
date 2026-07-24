import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronIcon } from "./form-control-icons";

export default function SelectField({
  id,
  label,
  value,
  options,
  placeholder = "Pilih opsi",
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  hideLabel = false,
  className = "",
  tone = "default",
}) {
  const selectedOption = options.find((option) => option.value === value);
  const labelId = `${id}-label`;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`issa-control-field issa-select-field issa-control-tone--${tone} ${className}`}>
      <label id={labelId} htmlFor={id} className={`issa-control-label ${hideLabel ? "sr-only" : ""}`}>{label}</label>
      <Listbox value={value} onChange={onChange} disabled={disabled} invalid={Boolean(error)}>
        <ListboxButton
          id={id}
          className="issa-select-trigger"
          aria-labelledby={`${labelId} ${id}`}
          aria-describedby={describedBy}
          aria-required={required}
        >
          <span className={`issa-select-trigger__value ${selectedOption ? "" : "is-placeholder"}`}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronIcon className="issa-select-trigger__chevron" />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom start", gap: 6, padding: 8 }}
          portal
          className="issa-options-panel"
        >
          {options.length === 0 && (
            <ListboxOption value="__issa_empty__" disabled className="issa-option is-empty">
              Tidak ada pilihan
            </ListboxOption>
          )}
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              data-tone={option.tone || undefined}
              className="issa-option"
            >
              <span className="issa-option__label">{option.label}</span>
              <CheckIcon className="issa-option__check" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
      {error && <p id={errorId} className="issa-control-error">{error}</p>}
    </div>
  );
}
