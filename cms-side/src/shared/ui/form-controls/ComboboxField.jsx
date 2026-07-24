import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronIcon, SearchIcon } from "./form-control-icons";

export default function ComboboxField({
  id,
  label,
  value,
  options,
  placeholder = "Cari atau pilih opsi",
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = "",
  tone = "default",
}) {
  const [query, setQuery] = useState("");
  const labelId = `${id}-label`;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLocaleLowerCase("id-ID").includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className={`issa-control-field issa-combobox-field issa-control-tone--${tone} ${className}`}>
      <label id={labelId} htmlFor={id} className="issa-control-label">{label}</label>
      <Combobox
        value={value}
        onChange={(nextValue) => {
          if (nextValue != null) onChange(nextValue);
        }}
        onClose={() => setQuery("")}
        disabled={disabled}
        invalid={Boolean(error)}
      >
        <div className="issa-combobox-shell">
          <SearchIcon className="issa-combobox-shell__search" />
          <ComboboxInput
            id={id}
            className="issa-combobox-input"
            displayValue={() => selectedOption?.label || ""}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-required={required}
          />
          <ComboboxButton className="issa-combobox-button" aria-label={`Buka pilihan ${label}`}>
            <ChevronIcon className="issa-select-trigger__chevron" />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor={{ to: "bottom start", gap: 6, padding: 8 }}
          portal
          className="issa-options-panel"
        >
          {filteredOptions.length === 0 && (
            <div className="issa-option is-empty">Tidak ada hasil untuk “{query}”</div>
          )}
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="issa-option"
            >
              <span className="issa-option__label">{option.label}</span>
              <CheckIcon className="issa-option__check" />
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
      {helperText && <p id={helperId} className="issa-control-helper">{helperText}</p>}
      {error && <p id={errorId} className="issa-control-error">{error}</p>}
    </div>
  );
}
