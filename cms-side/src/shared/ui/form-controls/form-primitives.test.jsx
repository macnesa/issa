import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Checkbox } from "flowbite-react/components/Checkbox";
import { FileInput } from "flowbite-react/components/FileInput";
import { Radio } from "flowbite-react/components/Radio";
import { Textarea } from "flowbite-react/components/Textarea";
import { StoreInit } from "flowbite-react/store/init";
import { ThemeProvider } from "flowbite-react/theme/provider";
import { issaFlowbiteTheme } from "../flowbite-theme";
import NumberField from "./NumberField";
import TextField from "./TextField";

function renderWithTheme(children) {
  return render(
    <>
      <StoreInit dark={false} prefix="" version={3} />
      <ThemeProvider theme={issaFlowbiteTheme}>{children}</ThemeProvider>
    </>
  );
}

describe("Flowbite-backed ISSA form primitives", () => {
  test("TextField preserves label, helper, error, disabled, and passthrough contracts", () => {
    const { container } = renderWithTheme(
      <>
        <TextField
          id="teacher-name"
          label="Nama guru"
          error="Nama wajib diisi."
          helperText="Gunakan nama lengkap."
          aria-describedby="teacher-name-context"
          autoComplete="name"
          className="consumer-field"
          data-contract="preserved"
        />
        <TextField
          id="teacher-nip"
          label="NIP"
          disabled
          value="123"
          onChange={() => {}}
        />
      </>
    );

    const input = screen.getByLabelText("Nama guru");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "teacher-name-context teacher-name-error teacher-name-helper"
    );
    expect(input).toHaveAttribute("autocomplete", "name");
    expect(input).toHaveAttribute("data-contract", "preserved");
    expect(screen.getByText("Nama wajib diisi.")).toHaveAttribute(
      "id",
      "teacher-name-error"
    );
    expect(screen.getByText("Gunakan nama lengkap.")).toHaveAttribute(
      "id",
      "teacher-name-helper"
    );
    expect(container.querySelector(".consumer-field")).toBeInTheDocument();
    expect(screen.getByLabelText("NIP")).toBeDisabled();
  });

  test("NumberField preserves string values, numeric constraints, and validation", () => {
    function ControlledNumber() {
      const [value, setValue] = useState("");
      return (
        <NumberField
          id="score"
          label="Nilai"
          value={value}
          onChange={setValue}
          min="0"
          max="100"
          step="1"
          error={value === "101" ? "Nilai maksimal 100." : ""}
          helperText="Masukkan angka bulat."
        />
      );
    }

    renderWithTheme(<ControlledNumber />);
    const input = screen.getByLabelText("Nilai");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "1");

    fireEvent.change(input, { target: { value: "101" } });
    expect(input).toHaveValue(101);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Nilai maksimal 100.")).toBeInTheDocument();
  });

  test("Textarea remains controlled and preserves limits and disabled/read-only states", () => {
    function ControlledTextarea() {
      const [value, setValue] = useState("Catatan awal");
      return (
        <>
          <label htmlFor="notes">Catatan</label>
          <Textarea
            id="notes"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={20}
          />
          <Textarea aria-label="Terkunci" value="Tetap" readOnly />
          <Textarea aria-label="Nonaktif" value="" disabled onChange={() => {}} />
        </>
      );
    }

    renderWithTheme(<ControlledTextarea />);
    const textarea = screen.getByLabelText("Catatan");
    fireEvent.change(textarea, { target: { value: "Catatan berubah" } });
    expect(textarea).toHaveValue("Catatan berubah");
    expect(textarea).toHaveAttribute("maxlength", "20");
    expect(screen.getByLabelText("Terkunci")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Nonaktif")).toBeDisabled();
  });

  test("Checkbox, Radio, and FileInput retain native form behavior", () => {
    const onCheckboxChange = vi.fn();
    const onRadioChange = vi.fn();
    const onFileChange = vi.fn();
    const file = new File(["record"], "record.png", { type: "image/png" });

    renderWithTheme(
      <>
        <label htmlFor="source-journal">Jurnal</label>
        <Checkbox
          id="source-journal"
          color="issa"
          onChange={onCheckboxChange}
        />
        <label htmlFor="source-disabled">Sumber nonaktif</label>
        <Checkbox id="source-disabled" color="issa" disabled />

        <fieldset>
          <legend>Panjang</legend>
          <label htmlFor="length-short">Ringkas</label>
          <Radio
            id="length-short"
            name="length"
            color="issa"
            onChange={onRadioChange}
          />
          <label htmlFor="length-medium">Sedang</label>
          <Radio id="length-medium" name="length" color="issa" disabled />
        </fieldset>

        <label htmlFor="evidence-file">Foto evidence</label>
        <FileInput
          id="evidence-file"
          accept="image/jpeg,image/png,image/webp"
          color="issa"
          sizing="issa"
          onChange={onFileChange}
        />
      </>
    );

    fireEvent.click(screen.getByLabelText("Jurnal"));
    expect(onCheckboxChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Sumber nonaktif")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Ringkas"));
    expect(onRadioChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Sedang")).toBeDisabled();
    expect(screen.getByLabelText("Ringkas")).toHaveAttribute("name", "length");

    fireEvent.change(screen.getByLabelText("Foto evidence"), {
      target: { files: [file] },
    });
    expect(onFileChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Foto evidence")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp"
    );
  });
});
