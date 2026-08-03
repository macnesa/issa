import { tw } from "../tw";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronIcon } from "./form-control-icons";
import {
  fieldMessageClasses,
  optionClasses,
  triggerClasses,
} from "./controlStyles";

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
    <div className={tw(`issa-control-field min-w-0 issa-select-field issa-control-tone--${tone} ${className}`)}>
      <label id={labelId} htmlFor={id} className={tw(`issa-control-label block mb-1 text-issa-text text-label font-semibold ${hideLabel ? "sr-only" : ""}`)}>{label}</label>
      <Listbox value={value} onChange={onChange} disabled={disabled} invalid={Boolean(error)}>
        <ListboxButton
          id={id}
          className={tw(triggerClasses, "issa-select-trigger data-[open]:[&_.issa-select-trigger__chevron]:rotate-180")}
          aria-labelledby={`${labelId} ${id}`}
          aria-describedby={describedBy}
          aria-required={required}
        >
          <span className={tw("issa-select-trigger__value min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap", !selectedOption && "is-placeholder text-issa-muted")}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronIcon className={tw("issa-select-trigger__chevron w-4 h-4 flex-none text-issa-muted transition-transform duration-fast")} />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom start", gap: 6, padding: 8 }}
          portal
          className={tw("issa-options-panel z-popover [width:var(--button-width,_var(--input-width))] [max-width:calc(100vw_-_1rem)] [max-height:min(19rem,_var(--anchor-max-height))] overflow-y-auto border border-issa-border-strong rounded-dialog bg-issa-surface p-1 shadow-dialog text-issa-text outline-none")}
        >
          {options.length === 0 && (
            <ListboxOption value="__issa_empty__" disabled className={tw(optionClasses, "is-empty italic text-issa-muted")}>
              Tidak ada pilihan
            </ListboxOption>
          )}
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              data-tone={option.tone || undefined}
              className={tw(optionClasses)}
            >
              <span className={tw("issa-option__label min-w-0 overflow-hidden text-ellipsis")}>{option.label}</span>
              <CheckIcon className={tw("issa-option__check w-4 h-4 flex-none text-issa-accent opacity-0")} />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      {helperText && <p id={helperId} className={tw("issa-control-helper text-issa-muted", fieldMessageClasses)}>{helperText}</p>}
      {error && <p id={errorId} className={tw("issa-control-error font-semibold text-issa-danger", fieldMessageClasses)}>{error}</p>}
    </div>
  );
}
