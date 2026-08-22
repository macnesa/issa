import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "flowbite-react/theme/provider";
import { StoreInit } from "flowbite-react/store/init";
import { MemoryRouter } from "react-router-dom";
import {
  ButtonLink,
  DestructiveButton,
  ErrorState,
  InlineNotice,
  LedgerShell,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StudentContextHeader,
  Surface,
  TertiaryButton,
  WorkspacePanel,
  WorkspaceTabs,
} from "./ui";
import { issaFlowbiteApplyTheme, issaFlowbiteTheme } from "./flowbite-theme";

function renderWithTheme(children) {
  return render(
    <>
      <StoreInit dark={false} prefix="" version={3} />
      <ThemeProvider applyTheme={issaFlowbiteApplyTheme} theme={issaFlowbiteTheme}>
        {children}
      </ThemeProvider>
    </>
  );
}

describe("Institutional Ledger shared UI", () => {
  test("surface variants and semantic status tones remain explicit", () => {
    const { container } = renderWithTheme(
      <>
        <Surface variant="subtle">Subtle record</Surface>
        <StatusBadge status="Lulus" />
        <StatusBadge status="Alfa" />
        <StatusBadge status="Perlu perhatian" tone="attention" aria-label="Status perhatian" />
      </>
    );

    expect(container.querySelector(".issa-surface--subtle")).toHaveTextContent(
      "Subtle record"
    );
    const successBadge = screen.getByText("Lulus").closest("[data-tone]");
    expect(successBadge).toHaveAttribute("data-tone", "success");
    expect(successBadge).toHaveClass(
      "issa-badge-size",
      "issa-badge-without-icon",
      "px-2",
      "py-1"
    );
    expect(successBadge).not.toHaveClass("p-1", "text-xs");
    expect(successBadge).not.toHaveClass("rounded", "py-0.5", "hover:bg-green-200");
    expect(screen.getByText("Alfa").closest("[data-tone]"))
      .toHaveAttribute("data-tone", "danger");
    expect(screen.getByLabelText("Status perhatian"))
      .toHaveClass("issa-status-badge--attention", "text-issa-accent");
    expect(screen.getAllByTestId("flowbite-badge")).toHaveLength(3);
  });

  test("loading button is disabled and communicates busy state", () => {
    const onClick = vi.fn();
    const { container } = renderWithTheme(
      <PrimaryButton loading loadingLabel="Menyimpan record" onClick={onClick}>
        Simpan
      </PrimaryButton>
    );

    const button = screen.getByRole("button", { name: "Menyimpan record" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector(".issa-button__spinner")?.closest("[aria-hidden='true']"))
      .toBeInTheDocument();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("Flowbite-backed feedback and loading preserve application semantics", () => {
    const { container } = renderWithTheme(
      <>
        <InlineNotice role="note" tone="warning">
          Demo hanya-baca
        </InlineNotice>
        <ErrorState message="Record gagal dimuat" />
        <LoadingState label="Memuat record" />
      </>
    );

    expect(screen.getByRole("note")).toHaveTextContent("Demo hanya-baca");
    expect(screen.getByRole("note")).toHaveClass(
      "issa-inline-notice",
      "border-l-issa-warning"
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Record gagal dimuat");
    expect(screen.getByRole("alert")).toHaveClass("issa-state--error");
    expect(screen.getByRole("status")).toHaveTextContent("Memuat record");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(container.querySelector(".issa-state__loading-content svg"))
      .toBeInTheDocument();
  });

  test("Flowbite-backed button variants preserve behavior and passthrough", () => {
    const onPrimary = vi.fn();
    renderWithTheme(
      <>
        <PrimaryButton
          className="consumer-button-class"
          data-contract="preserved"
          onClick={onPrimary}
        >
          Simpan
        </PrimaryButton>
        <SecondaryButton type="button">Batal</SecondaryButton>
        <TertiaryButton type="button" compact>Lihat detail</TertiaryButton>
        <DestructiveButton type="button" disabled>Hapus</DestructiveButton>
        <PrimaryButton type="submit" tone="login">Masuk</PrimaryButton>
        <SecondaryButton type="button" tone="loginSecondary">Jelajahi Demo</SecondaryButton>
      </>
    );

    const primary = screen.getByRole("button", { name: "Simpan" });
    expect(primary).toHaveClass(
      "issa-button",
      "issa-button--primary",
      "bg-issa-accent",
      "h-auto",
      "focus:ring-0",
      "consumer-button-class"
    );
    expect(primary).not.toHaveClass("h-10", "rounded-lg", "focus:ring-4");
    expect(primary).toHaveAttribute("data-contract", "preserved");
    expect(primary).not.toHaveAttribute("type");
    expect(primary).toHaveProperty("type", "submit");
    fireEvent.click(primary);
    expect(onPrimary).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("button", { name: "Batal" }))
      .toHaveClass("issa-button--secondary", "bg-issa-surface");
    expect(screen.getByRole("button", { name: "Lihat detail" }))
      .toHaveClass("issa-button--tertiary", "issa-button--compact");
    expect(screen.getByRole("button", { name: "Hapus" }))
      .toHaveClass("issa-button--destructive", "bg-issa-danger");
    expect(screen.getByRole("button", { name: "Hapus" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Masuk" }))
      .toHaveClass("min-h-[2.8rem]", "!rounded-[0.08rem]", "issa-button--login");
    expect(screen.getByRole("button", { name: "Jelajahi Demo" }))
      .toHaveClass("min-h-[2.8rem]", "!rounded-[0.08rem]", "issa-button--loginSecondary");
  });

  test("workspace tabs support click and roving keyboard activation", () => {
    const onChange = vi.fn();
    const items = [
      { id: "summary", label: "Ringkasan" },
      { id: "scores", label: "Nilai" },
      { id: "feedback", label: "Feedback" },
    ];
    render(
      <WorkspaceTabs
        items={items}
        activeId="summary"
        onChange={onChange}
        ariaLabel="Workspace siswa"
        idPrefix="student-workspace"
      />
    );

    const summary = screen.getByRole("tab", { name: "Ringkasan" });
    const scores = screen.getByRole("tab", { name: "Nilai" });
    expect(summary).toHaveAttribute("tabindex", "0");
    expect(scores).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(summary, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("scores");
    expect(scores).toHaveFocus();

    fireEvent.click(screen.getByRole("tab", { name: "Feedback" }));
    expect(onChange).toHaveBeenCalledWith("feedback");
  });

  test("student context keeps factual identity and action contract", () => {
    renderWithTheme(
      <MemoryRouter initialEntries={["/"]}>
        <StudentContextHeader
          student={{ name: "Ayu Pratama", NIM: "2026071001" }}
          classLabel="1A"
          headingLevel="h1"
          metadata={[{ label: "Status", value: "Record aktif" }]}
          actions={<ButtonLink to="/students/7">Kembali</ButtonLink>}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Ayu Pratama", level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByText("2026071001")).toHaveClass("issa-no-wrap");
    expect(screen.getByText("1A")).toBeInTheDocument();
    expect(screen.getByText("Record aktif")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali" }))
      .toHaveAttribute("href", "/students/7");
    expect(screen.getByRole("link", { name: "Kembali" }))
      .toHaveClass("issa-button", "issa-button--secondary");
    expect(screen.getByRole("link", { name: "Kembali" }))
      .not.toHaveAttribute("type");
  });

  test("ledger shell owns loading, error, empty, and overflow behavior", () => {
    const { rerender } = render(
      <LedgerShell title="Riwayat" loading loadingLabel="Memuat ledger" />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Memuat ledger");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(
      <LedgerShell title="Riwayat" error="Ledger gagal dimuat" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Ledger gagal dimuat");

    rerender(
      <LedgerShell
        title="Riwayat"
        empty
        emptyTitle="Belum ada record"
        overflow
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Belum ada record");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(document.querySelector(".issa-ledger-shell__body--overflow"))
      .toBeInTheDocument();
  });

  test("workspace panel exposes the linked tabpanel contract", () => {
    render(
      <WorkspacePanel id="workspace-scores" labelledBy="workspace-tab-scores">
        Isi nilai
      </WorkspacePanel>
    );
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "workspace-scores");
    expect(panel).toHaveAttribute("aria-labelledby", "workspace-tab-scores");
  });
});
