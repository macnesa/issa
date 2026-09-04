import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeacherAttentionQueue from "./TeacherAttentionQueue";

const attentionItem = {
  student: {
    id: 7,
    name: "Ari Wibowo",
    nim: "2026071001",
    photo: "https://example.test/ari.png",
  },
  priority: "high",
  flags: [
    {
      type: "attendance_attention",
      rate: 81,
      recordedDays: 21,
    },
    {
      type: "academic_attention",
      lessonName: "Matematika",
      latestScores: [68, 72],
      kkm: 75,
    },
  ],
};

function renderQueue(props = {}) {
  return render(
    <MemoryRouter>
      <TeacherAttentionQueue {...props} />
    </MemoryRouter>
  );
}

function mockFetchResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe("TeacherAttentionQueue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem("access_token", "teacher-token");
  });

  it("menampilkan loading sebelum request selesai", () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderQueue();

    expect(screen.getByLabelText("Memuat siswa yang perlu ditinjau"))
      .toBeInTheDocument();
  });

  it("menampilkan beberapa alasan relevan untuk siswa yang sama", async () => {
    const onCountChange = vi.fn();
    global.fetch = vi.fn(() => mockFetchResponse([attentionItem]));
    renderQueue({ onCountChange });

    expect(await screen.findByText("Ari Wibowo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Perlu ditinjau" }))
      .toBeInTheDocument();
    expect(screen.getByText("2 alasan untuk ditinjau")).toBeInTheDocument();
    expect(screen.getByText("Kehadiran")).toBeInTheDocument();
    expect(screen.getByText("81% pada 21 hari tercatat dalam 30 hari terakhir.")).toBeInTheDocument();
    expect(screen.getByText("Penilaian")).toBeInTheDocument();
    expect(screen.getByText("Matematika: 68 setelah 72. Di bawah KKM 75.")).toBeInTheDocument();
    expect(screen.queryByText("Data yang terlihat")).not.toBeInTheDocument();
    expect(screen.queryByText("Interpretasi sistem")).not.toBeInTheDocument();
    expect(screen.queryByText(/NIM 2026071001/)).not.toBeInTheDocument();

    const row = screen.getByText("Ari Wibowo").closest("li");
    expect(row).not.toHaveTextContent(/high priority|medium priority|low priority/i);
    expect(screen.getByRole("link", { name: "Tinjau siswa Ari Wibowo" }))
      .toHaveAttribute("href", "/students/7");
    expect(screen.getByRole("link", { name: "Tinjau siswa Ari Wibowo" }))
      .toHaveTextContent("Buka siswa");
    expect(onCountChange).toHaveBeenLastCalledWith(1);
  });

  it("menampilkan empty state", async () => {
    global.fetch = vi.fn(() => mockFetchResponse([]));
    renderQueue();

    expect(await screen.findByText(
      "Tidak ada siswa yang perlu ditinjau saat ini."
    )).toBeInTheDocument();
  });

  it("menampilkan error dan retry tetap bekerja", async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() => mockFetchResponse(
        { msg: "Daftar belum tersedia." },
        false
      ))
      .mockImplementationOnce(() => mockFetchResponse([attentionItem]));
    renderQueue();

    expect(await screen.findByText("Daftar belum tersedia."))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText("Ari Wibowo")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
