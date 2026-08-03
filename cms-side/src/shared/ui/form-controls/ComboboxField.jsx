import { tw } from "../tw";
import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronIcon, SearchIcon } from "./form-control-icons";
import {
  fieldMessageClasses,
  optionClasses,
  triggerClasses,
} from "./controlStyles";

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
    <div className={tw(`issa-control-field min-w-0 issa-combobox-field issa-control-tone--${tone} ${className}`)}>
      <label id={labelId} htmlFor={id} className={tw("issa-control-label block mb-1 text-issa-text text-label font-semibold")}>{label}</label>
      <Combobox
        value={value}
        onChange={(nextValue) => {
          if (nextValue != null) onChange(nextValue);
        }}
        onClose={() => setQuery("")}
        disabled={disabled}
        invalid={Boolean(error)}
      >
        <div className={tw(triggerClasses, "issa-combobox-shell relative flex items-center p-0 focus-within:border-issa-accent focus-within:outline focus-within:outline-emphasis focus-within:outline-offset-4 focus-within:outline-issa-focus focus-within:[box-shadow:inset_var(--issa-border-width-emphasis)_0_0_var(--issa-selection)] has-[input[aria-invalid=true]]:border-issa-danger has-[input[aria-invalid=true]]:bg-[color-mix(in_srgb,var(--issa-danger)_7%,var(--issa-surface))] has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-issa-disabled has-[input:disabled]:text-issa-text-disabled")}>
          <SearchIcon className={tw("issa-combobox-shell__search absolute [left:0.72rem] w-4 h-4 text-issa-muted pointer-events-none")} />
          <ComboboxInput
            id={id}
            className={tw("issa-combobox-input w-full min-h-control border-0 bg-transparent [padding:0.55rem_2.45rem_0.55rem_2.25rem] text-issa-text text-body outline-none")}
            displayValue={() => selectedOption?.label || ""}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-required={required}
          />
          <ComboboxButton className={tw("issa-combobox-button absolute right-0 grid w-9 h-full place-items-center border-0 bg-transparent text-issa-muted outline-none data-[focus]:outline data-[focus]:-outline-offset-4 data-[focus]:outline-emphasis data-[focus]:outline-issa-focus data-[open]:[&_.issa-select-trigger__chevron]:rotate-180")} aria-label={`Buka pilihan ${label}`}>
            <ChevronIcon className={tw("issa-select-trigger__chevron w-4 h-4 flex-none text-issa-muted transition-transform duration-fast")} />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor={{ to: "bottom start", gap: 6, padding: 8 }}
          portal
          className={tw("issa-options-panel z-popover [width:var(--button-width,_var(--input-width))] [max-width:calc(100vw_-_1rem)] [max-height:min(19rem,_var(--anchor-max-height))] overflow-y-auto border border-issa-border-strong rounded-dialog bg-issa-surface p-1 shadow-dialog text-issa-text outline-none")}
        >
          {filteredOptions.length === 0 && (
            <div className={tw(optionClasses, "is-empty italic text-issa-muted")}>Tidak ada hasil untuk “{query}”</div>
          )}
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={tw(optionClasses)}
            >
              <span className={tw("issa-option__label min-w-0 overflow-hidden text-ellipsis")}>{option.label}</span>
              <CheckIcon className={tw("issa-option__check w-4 h-4 flex-none text-issa-accent opacity-0")} />
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
      {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
      {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
    </div>
  );
}
