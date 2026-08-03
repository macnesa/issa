import { fireEvent, render, screen, within } from "@testing-library/react";
import ModalAttendances from "./ModalAttendances";

describe("ModalAttendances", () => {
  test("menampilkan tanggal record dalam format lokal yang mudah dibaca", () => {
    render(
      <ModalAttendances
        id="attendance-7"
        studentName="Ari Wibowo"
        data={[
          {
            id: 31,
            attendanceDate: "2026-07-21",
            status: "Hadir",
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lihat record" }));

    const dialog = screen.getByRole("dialog", { name: "Record attendance" });
    expect(within(dialog).getByText("21/07/2026")).toBeInTheDocument();
    expect(within(dialog).queryByText("2026-07-21")).not.toBeInTheDocument();
  });
});
