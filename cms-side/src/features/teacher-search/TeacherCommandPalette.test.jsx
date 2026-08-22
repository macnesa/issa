import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeacherCommandPalette from "./TeacherCommandPalette";
import { searchTeacherRecords } from "./teacherSearchApi";

vi.mock("./teacherSearchApi", () => ({
  searchTeacherRecords: vi.fn(),
}));

vi.mock("../../offline-workspace/connectionStatus", () => ({
  getOnlineHint: () => true,
  subscribeToConnectionStatus: () => () => {},
}));

function renderPalette() {
  return render(
    <MemoryRouter>
      <TeacherCommandPalette open onOpenChange={vi.fn()} />
    </MemoryRouter>
  );
}

describe("TeacherCommandPalette shared feedback primitives", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("uses the Flowbite spinner while search is pending", async () => {
    searchTeacherRecords.mockReturnValue(new Promise(() => {}));
    renderPalette();
    fireEvent.change(screen.getByPlaceholderText("Cari data ISSA…"), {
      target: { value: "ari" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    const progress = screen.getByRole("progressbar", { name: "Loading..." });
    expect(progress).toHaveTextContent("Mencari record…");
    expect(progress.querySelector("svg")).toBeInTheDocument();
  });

  test("uses the shared Flowbite notice when search fails", async () => {
    searchTeacherRecords.mockRejectedValue(new Error(
      "Pencarian belum dapat digunakan."
    ));
    renderPalette();
    fireEvent.change(screen.getByPlaceholderText("Cari data ISSA…"), {
      target: { value: "ari" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Pencarian belum dapat digunakan.");
    expect(alert).toHaveClass("issa-inline-notice--danger");
    expect(screen.getByRole("button", { name: "Coba lagi" }))
      .toBeInTheDocument();
  });
});
