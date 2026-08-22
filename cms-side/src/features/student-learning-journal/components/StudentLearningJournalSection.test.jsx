import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { fetchStudentEvidences } from "../../student-evidence/studentEvidenceApi";
import {
  createStudentLearningJournalEntry,
  fetchStudentLearningJournal,
  retractStudentLearningJournalEntry,
  updateStudentLearningJournalEntry,
} from "../studentLearningJournalApi";
import { localDateValue } from "../../../utils/recordDates";
import StudentLearningJournalSection from "./StudentLearningJournalSection";

vi.mock("../../student-evidence/studentEvidenceApi", () => ({
  fetchStudentEvidences: vi.fn(),
}));

vi.mock("../studentLearningJournalApi", () => ({
  createStudentLearningJournalEntry: vi.fn(),
  fetchStudentLearningJournal: vi.fn(),
  retractStudentLearningJournalEntry: vi.fn(),
  updateStudentLearningJournalEntry: vi.fn(),
}));

const evidence = {
  id: 7,
  title: "Hasil latihan Matematika",
  category: "assignment",
  observedAt: "2026-07-26",
  availability: "available",
  file: {
    url: "https://example.test/evidence.jpg",
    format: "jpg",
    size: 2048,
  },
};

const retractedEvidence = {
  id: 7,
  title: "Hasil latihan Matematika",
  category: "assignment",
  observedAt: "2026-07-26",
  availability: "retracted",
  file: null,
  retractionReason: "Tidak boleh ditampilkan",
};

const observationEntry = {
  id: 21,
  studentId: 1,
  type: "observation",
  content: "Ari menyelesaikan tiga soal pecahan dengan bantuan diagram.",
  voiceCaptureType: null,
  observedAt: "2026-07-26",
  teacher: { id: 2, name: "Guru Rina" },
  evidence,
  createdAt: "2026-07-26T08:00:00.000Z",
  updatedAt: "2026-07-26T09:00:00.000Z",
  wasEdited: true,
};

const directReflectionEntry = {
  ...observationEntry,
  id: 22,
  type: "student_reflection",
  content: "Aku lebih mudah memahami pecahan ketika digambar.",
  voiceCaptureType: "direct_quote",
  evidence: null,
  wasEdited: false,
};

const paraphrasedReflectionEntry = {
  ...observationEntry,
  id: 23,
  type: "student_reflection",
  content: "Ari menyampaikan bahwa diagram membantunya memahami pecahan.",
  voiceCaptureType: "paraphrased",
  evidence: null,
  wasEdited: false,
};

async function selectOption(label, optionName) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(label, "i") }));
  fireEvent.click(await screen.findByRole("option", { name: optionName }));
}

function deferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe("StudentLearningJournalSection Teacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchStudentEvidences.mockResolvedValue([evidence]);
  });

  it("menampilkan loading, copy berbagi, dan timeline lengkap sesuai urutan server", async () => {
    const request = deferredPromise();
    fetchStudentLearningJournal.mockReturnValue(request.promise);

    render(<StudentLearningJournalSection studentId="1" />);

    expect(screen.getByText("Memuat jurnal belajar siswa...")).toBeInTheDocument();
    expect(
      screen.getByText("Catatan ini akan dibagikan kepada orang tua siswa.")
    ).toBeInTheDocument();

    request.resolve([
      directReflectionEntry,
      paraphrasedReflectionEntry,
      observationEntry,
    ]);

    expect(await screen.findByText(directReflectionEntry.content)).toBeInTheDocument();
    const timelineEntries = screen.getAllByRole("listitem");
    expect(timelineEntries[0]).toHaveTextContent("Kutipan langsung");
    expect(timelineEntries[1]).toHaveTextContent("Dirangkum oleh guru");
    expect(timelineEntries[2]).toHaveTextContent("Diedit");
    expect(timelineEntries[2]).toHaveTextContent("Guru Rina");
    expect(timelineEntries[2]).toHaveTextContent("Hasil latihan Matematika");
    expect(timelineEntries[2]).toHaveTextContent("Tugas");
    expect(
      within(timelineEntries[2]).getByAltText(
        "Evidence terkait: Hasil latihan Matematika"
      )
    ).toBeInTheDocument();
  });

  it("menampilkan empty state journal", async () => {
    fetchStudentLearningJournal.mockResolvedValue([]);

    render(<StudentLearningJournalSection studentId="1" />);

    expect(
      await screen.findByText(
        "Belum ada catatan perjalanan belajar untuk siswa ini."
      )
    ).toBeInTheDocument();
  });

  it("menampilkan tombstone evidence tanpa image, link, atau reason", async () => {
    fetchStudentLearningJournal.mockResolvedValue([
      {
        ...observationEntry,
        evidence: retractedEvidence,
      },
    ]);

    render(<StudentLearningJournalSection studentId="1" />);
    const entry = await screen.findByRole("listitem");

    expect(
      within(entry).getByText("Evidence terkait telah dicabut.")
    ).toBeInTheDocument();
    expect(within(entry).getByText("Hasil latihan Matematika"))
      .toBeInTheDocument();
    expect(within(entry).getByText(/Tugas/)).toBeInTheDocument();
    expect(within(entry).queryByRole("img")).not.toBeInTheDocument();
    expect(within(entry).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Tidak boleh ditampilkan")).not.toBeInTheDocument();
  });

  it("refresh key memuat ulang Journal dan pilihan Evidence", async () => {
    fetchStudentLearningJournal.mockResolvedValue([observationEntry]);
    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" refreshKey={0} />
    );
    await screen.findByText(observationEntry.content);
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(1);
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(1);

    rerender(<StudentLearningJournalSection studentId="1" refreshKey={1} />);

    await waitFor(() => {
      expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
      expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
    });
  });

  it("membersihkan selection form ketika evidence aktif sudah dicabut", async () => {
    fetchStudentLearningJournal
      .mockResolvedValueOnce([observationEntry])
      .mockResolvedValueOnce([
        { ...observationEntry, evidence: retractedEvidence },
      ]);
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([]);
    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" refreshKey={0} />
    );
    await screen.findByText(observationEntry.content);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Evidence terkait" }))
      .toHaveTextContent("Hasil latihan Matematika");

    rerender(<StudentLearningJournalSection studentId="1" refreshKey={1} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Evidence terkait" }))
        .toHaveTextContent("Tidak dihubungkan ke evidence");
    });
    expect(
      await screen.findByText("Evidence terkait telah dicabut.")
    ).toBeInTheDocument();
  });

  it("menampilkan error dan retry yang memuat timeline kembali", async () => {
    fetchStudentLearningJournal
      .mockRejectedValueOnce(new Error("Koneksi terputus."))
      .mockResolvedValueOnce([observationEntry]);

    render(<StudentLearningJournalSection studentId="1" />);

    expect(
      await screen.findByText(
        "Jurnal belajar belum dapat dimuat. Koneksi terputus."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
  });

  it("memakai Journal cached saat network gagal dan menjaga form read-only", async () => {
    fetchStudentLearningJournal.mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    render(
      <StudentLearningJournalSection
        studentId="1"
        cachedEntries={[observationEntry]}
        hasCachedSnapshot
        offlineReadOnly
      />
    );

    expect(await screen.findByText(observationEntry.content))
      .toBeInTheDocument();
    expect(screen.getByText("Mode offline · catatan hanya dapat dibaca."))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan catatan" }))
      .toBeDisabled();
    expect(screen.queryByRole("button", { name: "Edit" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cabut catatan" }))
      .not.toBeInTheDocument();
    expect(createStudentLearningJournalEntry).not.toHaveBeenCalled();
  });

  it("mengubah helper sesuai jenis dan menghapus field capture setelah reflection diganti", async () => {
    fetchStudentLearningJournal.mockResolvedValue([]);
    render(<StudentLearningJournalSection studentId="1" />);
    await screen.findByText(
      "Belum ada catatan perjalanan belajar untuk siswa ini."
    );

    await selectOption("Jenis catatan", "Observasi");
    expect(
      screen.getByText(
        "Catat sesuatu yang benar-benar terlihat atau terdengar. Hindari diagnosis atau label terhadap siswa."
      )
    ).toBeInTheDocument();

    await selectOption("Jenis catatan", "Refleksi siswa");
    expect(
      screen.getByText(
        "Catat ucapan atau refleksi siswa sedekat mungkin dengan yang disampaikan."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tipe pencatatan refleksi/i })
    ).toBeInTheDocument();

    await selectOption("Tipe pencatatan refleksi", "Kutipan langsung");
    expect(
      screen.getByText(
        "Gunakan kata-kata siswa sedekat mungkin dengan ucapan aslinya."
      )
    ).toBeInTheDocument();

    await selectOption("Jenis catatan", "Dukungan yang dicoba");
    expect(
      screen.queryByRole("button", { name: /Tipe pencatatan refleksi/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Catat dukungan yang dicoba dan respons yang terlihat.")
    ).toBeInTheDocument();
  });

  it("mengirim payload create, mencegah double submit, mereset form, dan refetch", async () => {
    const createRequest = deferredPromise();
    fetchStudentLearningJournal
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([observationEntry]);
    createStudentLearningJournalEntry.mockReturnValue(createRequest.promise);

    render(<StudentLearningJournalSection studentId="1" />);
    await screen.findByText(
      "Belum ada catatan perjalanan belajar untuk siswa ini."
    );

    await selectOption("Jenis catatan", "Observasi");
    fireEvent.change(screen.getByLabelText("Isi catatan"), {
      target: { value: "Ari menggunakan diagram untuk memeriksa jawabannya." },
    });
    await selectOption("Evidence terkait", /Hasil latihan Matematika/);

    const submitButton = screen.getByRole("button", { name: "Simpan catatan" });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(createStudentLearningJournalEntry).toHaveBeenCalledTimes(1);
    expect(createStudentLearningJournalEntry).toHaveBeenCalledWith("1", {
      type: "observation",
      content: "Ari menggunakan diagram untuk memeriksa jawabannya.",
      observedAt: localDateValue(),
      evidenceId: 7,
    });
    expect(submitButton).toBeDisabled();

    createRequest.resolve(observationEntry);

    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Isi catatan")).toHaveValue("");
    });
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
  });

  it("mengirim sumber reflection hanya untuk reflection", async () => {
    fetchStudentLearningJournal
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([directReflectionEntry]);
    createStudentLearningJournalEntry.mockResolvedValue(directReflectionEntry);

    render(<StudentLearningJournalSection studentId="1" />);
    await screen.findByText(
      "Belum ada catatan perjalanan belajar untuk siswa ini."
    );

    await selectOption("Jenis catatan", "Refleksi siswa");
    await selectOption("Tipe pencatatan refleksi", "Dirangkum oleh guru");
    fireEvent.change(screen.getByLabelText("Isi catatan"), {
      target: { value: "Ari menjelaskan bahwa gambar membantunya." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan catatan" }));
    });

    await waitFor(() => {
      expect(createStudentLearningJournalEntry).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          type: "student_reflection",
          voiceCaptureType: "paraphrased",
        })
      );
    });
    expect(
      await screen.findByText(directReflectionEntry.content)
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Catatan perjalanan belajar berhasil disimpan.")
    ).toBeInTheDocument();
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
  });

  it("menghapus voiceCaptureType dari payload setelah type bukan reflection", async () => {
    fetchStudentLearningJournal
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([observationEntry]);
    createStudentLearningJournalEntry.mockResolvedValue(observationEntry);

    render(<StudentLearningJournalSection studentId="1" />);
    await screen.findByText(
      "Belum ada catatan perjalanan belajar untuk siswa ini."
    );

    await selectOption("Jenis catatan", "Refleksi siswa");
    await selectOption("Tipe pencatatan refleksi", "Kutipan langsung");
    await selectOption("Jenis catatan", "Dukungan yang dicoba");
    fireEvent.change(screen.getByLabelText("Isi catatan"), {
      target: { value: "Guru mencoba diagram dan Ari melanjutkan latihan." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan catatan" }));
    });

    expect(createStudentLearningJournalEntry).toHaveBeenCalledTimes(1);
    const payload = createStudentLearningJournalEntry.mock.calls[0][1];
    expect(payload).toEqual({
      type: "support_note",
      content: "Guru mencoba diagram dan Ari melanjutkan latihan.",
      observedAt: localDateValue(),
      evidenceId: null,
    });
    expect(payload).not.toHaveProperty("voiceCaptureType");
  });

  it("mengisi form edit, mengirim PATCH, dan cancel kembali ke mode create", async () => {
    fetchStudentLearningJournal
      .mockResolvedValueOnce([observationEntry])
      .mockResolvedValueOnce([{ ...observationEntry, content: "Catatan dikoreksi." }]);
    updateStudentLearningJournalEntry.mockResolvedValue({
      ...observationEntry,
      content: "Catatan dikoreksi.",
    });

    render(<StudentLearningJournalSection studentId="1" />);
    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Koreksi catatan")).toBeInTheDocument();
    expect(screen.getByLabelText("Isi catatan")).toHaveValue(
      observationEntry.content
    );
    expect(
      screen.getByRole("button", { name: "Evidence terkait" })
    ).toHaveTextContent("Hasil latihan Matematika");

    fireEvent.change(screen.getByLabelText("Isi catatan"), {
      target: { value: "Catatan dikoreksi." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan koreksi" }));
    });

    await waitFor(() => {
      expect(updateStudentLearningJournalEntry).toHaveBeenCalledWith(
        "1",
        21,
        {
          type: "observation",
          content: "Catatan dikoreksi.",
          observedAt: "2026-07-26",
          evidenceId: 7,
        }
      );
    });
    expect(await screen.findByText("Catatan dikoreksi.")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Simpan catatan" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal koreksi" }));
    expect(screen.getByLabelText("Isi catatan")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Simpan catatan" })).toBeInTheDocument();
  });

  it("meminta konfirmasi sebelum DELETE lalu refetch dan menutup dialog", async () => {
    fetchStudentLearningJournal
      .mockResolvedValueOnce([observationEntry])
      .mockResolvedValueOnce([]);
    retractStudentLearningJournalEntry.mockResolvedValue({
      id: 21,
      studentId: 1,
      retracted: true,
    });

    render(<StudentLearningJournalSection studentId="1" />);
    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cabut catatan" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Cabut catatan ini?")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Catatan tidak lagi terlihat oleh orang tua, tetapi tetap disimpan sebagai record internal."
      )
    ).toBeInTheDocument();
    expect(retractStudentLearningJournalEntry).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Cabut catatan" })
    );

    expect(
      await screen.findByText(
        "Belum ada catatan perjalanan belajar untuk siswa ini."
      )
    ).toBeInTheDocument();
    expect(retractStudentLearningJournalEntry).toHaveBeenCalledWith("1", 21);
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menampilkan kegagalan pencabutan melalui shared Flowbite notice", async () => {
    fetchStudentLearningJournal.mockResolvedValue([observationEntry]);
    retractStudentLearningJournalEntry.mockRejectedValue(new Error(
      "Catatan belum berhasil dicabut."
    ));

    render(<StudentLearningJournalSection studentId="1" />);
    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cabut catatan" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {
      name: "Cabut catatan",
    }));

    const alert = await within(screen.getByRole("dialog")).findByRole("alert");
    expect(alert).toHaveTextContent("Catatan belum berhasil dicabut.");
    expect(alert).toHaveClass("issa-inline-notice--danger");
  });
});
