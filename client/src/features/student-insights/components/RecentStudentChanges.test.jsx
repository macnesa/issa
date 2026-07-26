import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import apiClient from "../../../config/apiClient";
import RecentStudentChanges from "./RecentStudentChanges";

vi.mock("../../../config/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

const insights = {
  attendance: {
    recordedDays: 21,
    rate: 90.5,
  },
  academics: {
    overallTrend: "declining",
  },
  recentChanges: [
    {
      type: "score",
      lessonName: "Matematika",
      value: 87,
      previousValue: 92,
      direction: "declined",
      kkm: 75,
      occurredAt: "2026-07-25T08:00:00.000Z",
    },
    {
      type: "attendance",
      status: "Izin",
      occurredAt: "2026-07-24",
    },
    {
      type: "feedback",
      content: "Ari mencoba strategi baru saat berdiskusi.",
      occurredAt: "2026-07-23T08:00:00.000Z",
    },
  ],
};

describe("RecentStudentChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan loading sebelum request selesai", () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));
    render(<RecentStudentChanges studentId="7" />);

    expect(screen.getByLabelText("Memuat perubahan terbaru"))
      .toBeInTheDocument();
  });

  it("menampilkan perubahan secara faktual tanpa label diagnosis", async () => {
    apiClient.get.mockResolvedValue({ data: insights });
    render(<RecentStudentChanges studentId="7" />);

    expect(await screen.findByText(
      "Nilai terbaru Matematika adalah 87, setelah sebelumnya 92."
    )).toBeInTheDocument();
    expect(screen.getByText("Nilai masih berada di atas KKM 75."))
      .toBeInTheDocument();
    expect(screen.getByText(
      "Angka ini adalah pengukuran pada assessment yang tercatat, bukan kesimpulan tentang kemampuan siswa."
    )).toBeInTheDocument();
    expect(screen.getByText(
      "Status kehadiran pada 24 Juli 2026 tercatat sebagai Izin."
    )).toBeInTheDocument();
    expect(screen.getByText(
      "Catatan ini menunjukkan status yang dilaporkan tanpa menyimpulkan penyebabnya."
    )).toBeInTheDocument();
    expect(screen.getByText("Observasi guru")).toBeInTheDocument();
    expect(screen.getByText("Observasi guru baru ditambahkan."))
      .toBeInTheDocument();
    expect(screen.getByText("Ari mencoba strategi baru saat berdiskusi."))
      .toBeInTheDocument();

    const section = screen.getByRole("region", { name: "Perubahan terbaru" });
    expect(section).not.toHaveTextContent(
      /siswa bermasalah|siswa berisiko|performa buruk|gagal|attendance problem/i
    );
  });

  it("menjelaskan KKM tanpa menyimpulkan kemampuan saat nilai di bawahnya", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        ...insights,
        recentChanges: [{
          ...insights.recentChanges[0],
          value: 68,
          previousValue: null,
        }],
      },
    });
    render(<RecentStudentChanges studentId="7" />);

    expect(await screen.findByText("Nilai terbaru Matematika adalah 68."))
      .toBeInTheDocument();
    expect(screen.getByText(
      "KKM saat ini adalah 75. Guru dapat menambahkan konteks mengenai assessment dan dukungan berikutnya."
    )).toBeInTheDocument();
  });

  it("menampilkan empty state", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        attendance: { recordedDays: 0, rate: 0 },
        academics: { overallTrend: "insufficient_data" },
        recentChanges: [],
      },
    });
    render(<RecentStudentChanges studentId="7" />);

    expect(await screen.findByText(
      "Belum ada perubahan terbaru untuk ditampilkan."
    )).toBeInTheDocument();
  });

  it("menampilkan error dan retry tetap bekerja", async () => {
    apiClient.get
      .mockRejectedValueOnce({
        response: { status: 500, data: { msg: "Insight belum tersedia." } },
      })
      .mockResolvedValueOnce({ data: insights });
    render(<RecentStudentChanges studentId="7" />);

    expect(await screen.findByText("Insight belum tersedia."))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText(
      "Nilai terbaru Matematika adalah 87, setelah sebelumnya 92."
    )).toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });

  it("mempertahankan urutan backend dan batas enam item", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        ...insights,
        recentChanges: Array.from({ length: 7 }, (_, index) => ({
          type: "feedback",
          content: `Observasi ${index + 1}`,
          occurredAt: `2026-07-${String(25 - index).padStart(2, "0")}T08:00:00.000Z`,
        })),
      },
    });
    render(<RecentStudentChanges studentId="7" />);

    expect(await screen.findByText("Observasi 1")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.queryByText("Observasi 7")).not.toBeInTheDocument();
  });
});
