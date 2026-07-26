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

function renderQueue() {
  return render(
    <MemoryRouter>
      <TeacherAttentionQueue />
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

  it("memisahkan tindak lanjut, fakta, konteks, dan langkah manusiawi", async () => {
    global.fetch = vi.fn(() => mockFetchResponse([attentionItem]));
    renderQueue();

    expect(await screen.findByText("Ari Wibowo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Perlu ditinjau" }))
      .toBeInTheDocument();
    expect(screen.getAllByText("Perlu ditinjau · Interpretasi sistem"))
      .toHaveLength(1);
    expect(screen.getByText("Data yang terlihat")).toBeInTheDocument();
    expect(screen.getByText("Konteks")).toBeInTheDocument();
    expect(screen.getByText("Langkah berikut")).toBeInTheDocument();
    expect(screen.getByText(
      "Kehadiran tercatat 81% pada 21 hari yang memiliki catatan."
    )).toBeInTheDocument();
    expect(screen.getByText(
      "Tanyakan kondisi siswa dan keluarga sebelum menentukan dukungan."
    )).toBeInTheDocument();
    expect(screen.getByText(
      "Nilai terbaru Matematika adalah 68, setelah sebelumnya 72. KKM saat ini adalah 75."
    )).toBeInTheDocument();
    expect(screen.getByText(
      "Satu perubahan nilai belum cukup untuk menjelaskan perkembangan siswa."
    )).toBeInTheDocument();
    expect(screen.getByText("Tinjau segera")).toBeInTheDocument();

    const row = screen.getByText("Ari Wibowo").closest("li");
    expect(row).not.toHaveTextContent(/high priority|medium priority|low priority/i);
    expect(screen.getByRole("link", { name: "Buka Student Detail Ari Wibowo" }))
      .toHaveAttribute("href", "/students/7");
  });

  it("menampilkan empty state", async () => {
    global.fetch = vi.fn(() => mockFetchResponse([]));
    renderQueue();

    expect(await screen.findByText(
      "Tidak ada tindak lanjut yang ditandai saat ini."
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
