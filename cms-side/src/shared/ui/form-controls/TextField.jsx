import { tw } from "../tw";
import { HelperText } from "flowbite-react/components/HelperText";
import { Label } from "flowbite-react/components/Label";
import { TextInput } from "flowbite-react/components/TextInput";
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
  const {
    "aria-describedby": externalDescribedBy,
    "aria-invalid": externalInvalid,
    ...nativeInputProps
  } = inputProps;
  const describedBy = [externalDescribedBy, errorId, helperId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={tw(`issa-control-field min-w-0 ${className}`)}>
      <Label
        className={tw("issa-control-label")}
        disabled={Boolean(nativeInputProps.disabled)}
        htmlFor={id}
      >
        {label}
      </Label>
      <TextInput
        id={id}
        className={tw("issa-text-input")}
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
