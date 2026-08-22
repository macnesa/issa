import { render, screen } from "@testing-library/react";
import {
  Alert,
  Badge,
  Button,
  HelperText,
  Label,
  Spinner,
  TextInput,
  ThemeProvider,
} from "flowbite-react";
import { StoreInit } from "flowbite-react/store/init";
import { issaFlowbiteTheme } from "./flowbite-theme";

function renderFoundation(children) {
  return render(
    <>
      <StoreInit dark={false} prefix="" version={3} />
      <ThemeProvider theme={issaFlowbiteTheme}>{children}</ThemeProvider>
    </>
  );
}

describe("ISSA Flowbite foundation", () => {
  test("resolves Flowbite and applies ISSA button variants", () => {
    renderFoundation(
      <>
        <Button color="primary">Simpan</Button>
        <Button color="secondary">Batal</Button>
        <Button color="tertiary">Lihat detail</Button>
        <Button color="destructive" disabled>Hapus</Button>
      </>
    );

    expect(screen.getByRole("button", { name: "Simpan" }))
      .toHaveClass("bg-issa-accent", "text-issa-inverse");
    expect(screen.getByRole("button", { name: "Batal" }))
      .toHaveClass("bg-issa-surface", "text-issa-text");
    expect(screen.getByRole("button", { name: "Lihat detail" }))
      .toHaveClass("bg-transparent", "text-issa-accent");
    expect(screen.getByRole("button", { name: "Hapus" }))
      .toBeDisabled();
  });

  test("maps semantic badge tones through the centralized theme", () => {
    renderFoundation(
      <>
        <Badge color="issaNeutral">Netral</Badge>
        <Badge color="issaSuccess">Siap</Badge>
        <Badge color="issaWarning">Tinjau</Badge>
        <Badge color="issaDanger">Gagal</Badge>
        <Badge color="issaInfo">Informasi</Badge>
      </>
    );

    expect(screen.getByText("Netral").closest("[data-testid='flowbite-badge']"))
      .toHaveClass("text-issa-muted");
    expect(screen.getByText("Siap").closest("[data-testid='flowbite-badge']"))
      .toHaveClass("text-issa-success");
    expect(screen.getByText("Tinjau").closest("[data-testid='flowbite-badge']"))
      .toHaveClass("text-issa-warning");
    expect(screen.getByText("Gagal").closest("[data-testid='flowbite-badge']"))
      .toHaveClass("text-issa-danger");
    expect(screen.getByText("Informasi").closest("[data-testid='flowbite-badge']"))
      .toHaveClass("text-issa-info");
  });

  test("keeps label, helper, invalid, and disabled field semantics available", () => {
    renderFoundation(
      <div>
        <Label htmlFor="teacher-name" color="failure">Nama guru</Label>
        <TextInput
          id="teacher-name"
          aria-describedby="teacher-name-error"
          aria-invalid="true"
          color="failure"
        />
        <HelperText id="teacher-name-error" color="failure">
          Nama guru wajib diisi.
        </HelperText>
        <Label htmlFor="disabled-field" disabled>Field nonaktif</Label>
        <TextInput id="disabled-field" disabled />
      </div>
    );

    const input = screen.getByLabelText("Nama guru");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "teacher-name-error");
    expect(screen.getByText("Nama guru wajib diisi."))
      .toHaveAttribute("id", "teacher-name-error");
    expect(screen.getByLabelText("Field nonaktif")).toBeDisabled();
  });

  test("renders semantic alerts and readable loading composition", () => {
    renderFoundation(
      <>
        <Alert color="warning">Koneksi sedang ditinjau.</Alert>
        <div role="status" aria-live="polite">
          <Spinner role="presentation" aria-hidden="true" size="sm" />
          <span>Memuat data kelas.</span>
        </div>
      </>
    );

    expect(screen.getByRole("alert"))
      .toHaveClass("border-issa-warning", "text-issa-warning");
    expect(screen.getByRole("status"))
      .toHaveTextContent("Memuat data kelas.");
  });
});
