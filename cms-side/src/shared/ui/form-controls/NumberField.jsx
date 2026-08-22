import { tw } from "../tw";
import { HelperText } from "flowbite-react/components/HelperText";
import { Label } from "flowbite-react/components/Label";
import { TextInput } from "flowbite-react/components/TextInput";
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
  const {
    "aria-describedby": externalDescribedBy,
    "aria-invalid": externalInvalid,
    ...nativeInputProps
  } = inputProps;
  const describedBy = [externalDescribedBy, errorId, helperId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={tw(`issa-control-field min-w-0 issa-number-field ${className}`)}>
      <Label
        className={tw("issa-control-label", hideLabel && "sr-only")}
        disabled={Boolean(nativeInputProps.disabled)}
        htmlFor={id}
      >
        {label}
      </Label>
      <TextInput
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={tw("issa-number-control [&_input]:appearance-none [&_input]:[-moz-appearance:textfield]")}
        color={error ? "failure" : "gray"}
        aria-invalid={externalInvalid ?? Boolean(error)}
        aria-describedby={describedBy}
        {...nativeInputProps}
      />
      {helperText && (
        <HelperText id={helperId} className={tw("issa-control-helper")}>
          {helperText}
        </HelperText>
      )}
      {error && (
        <HelperText
          id={errorId}
          className={tw("issa-control-error font-semibold")}
          color="failure"
        >
          {error}
        </HelperText>
      )}
    </div>
  );
}
