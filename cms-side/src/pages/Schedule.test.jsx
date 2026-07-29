import { render, screen, waitFor } from "@testing-library/react";
import Schedule from "./Schedule";

const schedulePageMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchClassSchedule: vi.fn(() => ({ type: "schedule/list" })),
  schedules: [],
}));

vi.mock("react-redux", () => ({
  useDispatch: () => schedulePageMocks.dispatch,
  useSelector: (selector) => selector({
    schedules: { schedules: schedulePageMocks.schedules },
  }),
}));

vi.mock("../store/action/ActionCreator", () => ({
  fetchClassSchedule: schedulePageMocks.fetchClassSchedule,
}));

describe("Schedule route states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    schedulePageMocks.schedules = [];
    schedulePageMocks.dispatch.mockResolvedValue(undefined);
  });

  test("renders existing timetable grouping without changing its data", async () => {
    schedulePageMocks.schedules = [{
      id: 41,
      day: "Monday",
      Lesson: { name: "Matematika", KKM: 75 },
    }];
    render(<Schedule />);

    expect(await screen.findByRole("heading", {
      name: "Jadwal kelas",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Senin" }))
      .toBeInTheDocument();
    expect(screen.getByText("Matematika")).toBeInTheDocument();
    expect(screen.getByText("KKM 75")).toBeInTheDocument();
  });

  test("renders the empty state for a class without a schedule", async () => {
    render(<Schedule />);
    expect(await screen.findByText("Jadwal belum tersedia"))
      .toBeInTheDocument();
  });

  test("renders a factual fetch error", async () => {
    schedulePageMocks.dispatch.mockRejectedValue(
      new Error("Jadwal gagal diambil")
    );
    render(<Schedule />);

    expect(await screen.findByText("Jadwal gagal diambil"))
      .toBeInTheDocument();
    await waitFor(() => {
      expect(schedulePageMocks.fetchClassSchedule).toHaveBeenCalledTimes(1);
    });
  });
});
