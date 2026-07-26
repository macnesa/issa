import baseUrl from "../../config/api";
import {
  retractStudentEvidence,
  updateStudentEvidenceMetadata,
} from "./studentEvidenceApi";

describe("Student Evidence lifecycle API", () => {
  beforeEach(() => {
    localStorage.setItem("access_token", "teacher-token");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ id: 7 }),
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("PATCH mengirim hanya metadata JSON ke endpoint evidence", async () => {
    const metadata = {
      title: "Judul terkoreksi",
      category: "assessment",
      description: "Catatan terkoreksi",
      observedAt: "2026-07-26",
    };

    await updateStudentEvidenceMetadata("1", 7, metadata);

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/students/1/evidences/7`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          access_token: "teacher-token",
        },
        body: JSON.stringify(metadata),
      }
    );
  });

  it("DELETE mengirim reason sebagai JSON", async () => {
    await retractStudentEvidence("1", 7, "Evidence salah dibagikan.");

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/students/1/evidences/7`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          access_token: "teacher-token",
        },
        body: JSON.stringify({ reason: "Evidence salah dibagikan." }),
      }
    );
  });
});
