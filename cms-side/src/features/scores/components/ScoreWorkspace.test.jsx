import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CreateScoreForm from "./CreateScoreForm";
import ScoreHistory from "./ScoreHistory";

const scoreWorkspaceCss = readFileSync(
  "src/features/scores/score-workspace.css",
  "utf8"
);

const scoreMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  isDemo: false,
  updateStudentScore: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => scoreMocks.dispatch,
}));

vi.mock("../../../config/api", () => ({
  default: "/api",
}));

vi.mock("../../../store/action/ActionCreator", () => ({
  updateStudentScore: scoreMocks.updateStudentScore,
}));

vi.mock("../../../offline-workspace/OfflineWorkspaceProvider", () => ({
  useOfflineWorkspace: () => ({ isDemo: scoreMocks.isDemo }),
}));

vi.mock("../../../shared/ui/form-controls/SelectField", () => ({
  default: ({ id, label, value, onChange, options, disabled }) => (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("../../../shared/ui/form-controls/ComboboxField", () => ({
  default: ({ id, label, value, onChange, options, disabled }) => (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("../../../shared/ui/form-controls/DateTimeField", () => ({
  default: ({ id, label, value, onChange }) => (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

function response(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe("CreateScoreForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scoreMocks.isDemo = false;
    vi.stubGlobal("fetch", vi.fn((url, options = {}) => {
      if (options.method === "POST") return response({ data: { id: 99 } });
      if (String(url).endsWith("/lessons")) {
        return response([{ id: 1, name: "Matematika", KKM: 75 }]);
      }
      if (String(url).endsWith("/assignments")) {
        return response([{ id: 2, name: "Ulangan harian" }]);
      }
      return response({}, false);
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("menjelaskan dependensi, menampilkan KKM, dan mempertahankan payload nilai", async () => {
    const onCreated = vi.fn();
    const { container } = render(
      <CreateScoreForm studentId={7} onCreated={onCreated} />
    );

    const submitButton = screen.getByRole("button", { name: "Simpan nilai" });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(
      "Pilihan mata pelajaran dan penilaian sedang dimuat."
    )).toBeInTheDocument();

    await screen.findByRole("option", { name: "Matematika" });
    expect(screen.getByText("Pilih mata pelajaran terlebih dahulu."))
      .toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Mata pelajaran"), {
      target: { value: "1" },
    });
    expect(screen.getByText("Pilih penilaian untuk melanjutkan."))
      .toBeInTheDocument();
    expect(screen.getByText("KKM mata pelajaran terpilih"))
      .toBeInTheDocument();
    expect(screen.getByText("Rentang 0–100. Ketuntasan mulai 75."))
      .toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Penilaian"), {
      target: { value: "2" },
    });
    expect(submitButton).toBeEnabled();

    const scoreInput = screen.getByLabelText("Nilai siswa");
    expect(scoreInput).toHaveAttribute("type", "number");
    expect(scoreInput).toHaveAttribute("min", "0");
    expect(scoreInput).toHaveAttribute("max", "100");
    expect(scoreInput).toHaveAttribute("step", "1");

    fireEvent.change(scoreInput, { target: { value: "82" } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/scores",
        expect.objectContaining({ method: "POST" })
      );
    });
    const postRequest = global.fetch.mock.calls.find(
      ([, options]) => options?.method === "POST"
    );
    expect(JSON.parse(postRequest[1].body)).toEqual({
      StudentId: 7,
      LessonId: 1,
      AssignmentId: 2,
      value: 82,
    });
    expect(await screen.findByText("Nilai berhasil disimpan."))
      .toBeInTheDocument();
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  test("mengaktifkan form multi-kolom hanya di desktop dan menjaga submit satu baris penuh", () => {
    expect(scoreWorkspaceCss).toContain("@media (min-width: 1024px)");
    expect(scoreWorkspaceCss).not.toContain("@media (min-width: 760px)");
    expect(scoreWorkspaceCss).toMatch(
      /\.score-entry-ledger__submit\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s
    );
  });

  test("menolak perubahan nilai yang tidak valid tanpa request POST", async () => {
    const { container } = render(
      <CreateScoreForm studentId={7} onCreated={vi.fn()} />
    );
    await screen.findByRole("option", { name: "Matematika" });
    fireEvent.change(screen.getByLabelText("Mata pelajaran"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Penilaian"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Nilai siswa"), {
      target: { value: "101" },
    });
    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText(
      "Pilih mata pelajaran dan penilaian, lalu isi nilai bulat 0–100."
    )).toBeInTheDocument();
    expect(global.fetch.mock.calls.some(([, options]) => options?.method === "POST"))
      .toBe(false);
  });

  test("mode demo menampilkan data pilihan tetapi mengunci semua input dan submit", async () => {
    scoreMocks.isDemo = true;
    render(<CreateScoreForm studentId={7} onCreated={vi.fn()} />);

    await screen.findByRole("option", { name: "Matematika" });
    expect(screen.getByLabelText("Mata pelajaran")).toBeDisabled();
    expect(screen.getByLabelText("Penilaian")).toBeDisabled();
    expect(screen.getByLabelText("Nilai siswa")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Simpan nilai" })).toBeDisabled();
    expect(screen.getByText("Tidak tersedia dalam mode demo."))
      .toBeInTheDocument();
    expect(global.fetch.mock.calls.some(([, options]) => options?.method === "POST"))
      .toBe(false);
  });
});

describe("ScoreHistory", () => {
  const student = { id: 7, name: "Ayu" };
  const score = {
    id: 11,
    value: 82,
    status: true,
    category: "B",
    recordedAt: "2026-07-29T08:00:00.000Z",
    Lesson: { name: "Matematika", KKM: 75 },
    Assignment: { name: "Ulangan harian" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    scoreMocks.isDemo = false;
    scoreMocks.updateStudentScore.mockReturnValue({ type: "score/update" });
    scoreMocks.dispatch.mockResolvedValue({});
  });

  test("memisahkan mata pelajaran, penilaian, status, dan predikat", () => {
    render(<ScoreHistory scores={[score]} student={student} />);

    expect(screen.getByRole("columnheader", { name: "Mata pelajaran" }))
      .toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Penilaian" }))
      .toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" }))
      .toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Predikat" }))
      .toBeInTheDocument();

    const row = screen.getByText("Matematika").closest("tr");
    const status = within(row).getByText("Lulus");
    const predikat = within(row).getByText("B");
    expect(status.closest("td")).not.toBe(predikat.closest("td"));
    expect(within(row).getByText("Ulangan harian")).toBeInTheDocument();
  });

  test("tidak menampilkan kolom predikat ketika data tidak menyediakannya", () => {
    render(
      <ScoreHistory
        scores={[{ ...score, category: null }]}
        student={student}
      />
    );

    expect(screen.queryByRole("columnheader", { name: "Predikat" }))
      .not.toBeInTheDocument();
  });

  test("mempertahankan aksi pembaruan dan payload nilai yang ada", async () => {
    render(<ScoreHistory scores={[score]} student={student} />);

    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    fireEvent.change(screen.getByLabelText("Nilai siswa"), {
      target: { value: "90" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => {
      expect(scoreMocks.updateStudentScore).toHaveBeenCalledWith(7, {
        ScoreId: 11,
        value: 90,
      });
    });
    expect(scoreMocks.dispatch).toHaveBeenCalledWith({
      type: "score/update",
    });
    await waitFor(() => {
      expect(screen.queryByLabelText("Nilai siswa")).not.toBeInTheDocument();
    });
  });

  test("mode demo mempertahankan ledger terbaca tetapi mengunci aksi pembaruan", () => {
    scoreMocks.isDemo = true;
    render(<ScoreHistory scores={[score]} student={student} />);

    expect(screen.getByText("Matematika")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ubah" })).toBeDisabled();
    expect(screen.getByText("Tidak tersedia dalam mode demo."))
      .toBeInTheDocument();
    expect(scoreMocks.updateStudentScore).not.toHaveBeenCalled();
  });

  test("menampilkan empty state ledger ketika belum ada nilai", () => {
    render(<ScoreHistory scores={[]} student={student} />);

    expect(screen.getByText("Belum ada nilai tercatat")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
