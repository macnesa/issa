import { fireEvent, render, screen } from "@testing-library/react";
import AttendanceRecordEditor from "./AttendanceRecordEditor";

const record = {
  id: 31,
  studentId: 7,
  attendanceDate: "2026-07-21",
  status: "Izin",
  syncState: "pending",
};

describe("AttendanceRecordEditor offline state", () => {
  test("shows a text status and keeps the Attendance choice labelled", () => {
    render(
      <AttendanceRecordEditor
        record={record}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Menunggu sinkronisasi")).toBeInTheDocument();
    expect(screen.getByText("21/07/2026")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: /Status kehadiran 21\/07\/2026/,
    })).toBeEnabled();
  });

  test("shows failed error safely and allows a corrected selection", async () => {
    const onChange = vi.fn();
    render(
      <AttendanceRecordEditor
        record={{
          ...record,
          syncState: "failed",
          syncErrorMessage: "Perubahan kehadiran tidak valid.",
        }}
        onChange={onChange}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Perubahan kehadiran tidak valid."
    );
    fireEvent.click(screen.getByRole("button", {
      name: /Status kehadiran 21\/07\/2026/,
    }));
    fireEvent.click(await screen.findByRole("option", { name: "Sakit" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ syncState: "failed" }),
      "Sakit"
    );
  });

  test("locks direct edits while a conflict needs review", () => {
    render(
      <AttendanceRecordEditor
        record={{ ...record, syncState: "conflict" }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Perlu ditinjau")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: /Status kehadiran 21\/07\/2026/,
    })).toBeDisabled();
  });
});
