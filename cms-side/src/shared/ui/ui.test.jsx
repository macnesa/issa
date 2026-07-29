import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  ButtonLink,
  LedgerShell,
  PrimaryButton,
  StatusBadge,
  StudentContextHeader,
  Surface,
  WorkspacePanel,
  WorkspaceTabs,
} from "./ui";

describe("Institutional Ledger shared UI", () => {
  test("surface variants and semantic status tones remain explicit", () => {
    const { container } = render(
      <>
        <Surface variant="subtle">Subtle record</Surface>
        <StatusBadge status="Lulus" />
        <StatusBadge status="Alfa" />
      </>
    );

    expect(container.querySelector(".issa-surface--subtle")).toHaveTextContent(
      "Subtle record"
    );
    expect(screen.getByText("Lulus")).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("Alfa")).toHaveAttribute("data-tone", "danger");
  });

  test("loading button is disabled and communicates busy state", () => {
    render(
      <PrimaryButton loading loadingLabel="Menyimpan record">
        Simpan
      </PrimaryButton>
    );

    const button = screen.getByRole("button", { name: "Menyimpan record" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
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
    render(
      <MemoryRouter>
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
  });

  test("ledger shell owns loading, error, empty, and overflow behavior", () => {
    const { rerender } = render(
      <LedgerShell title="Riwayat" loading loadingLabel="Memuat ledger" />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Memuat ledger");

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
    expect(screen.getByText("Belum ada record")).toBeInTheDocument();
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
