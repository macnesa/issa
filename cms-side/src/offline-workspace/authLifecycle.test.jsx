import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const authLifecycleMocks = vi.hoisted(() => ({
  clearTeacherData: vi.fn().mockResolvedValue(undefined),
  hasUnsyncedAttendance: vi.fn().mockResolvedValue(false),
}));

vi.mock("./mutationQueue", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    clearTeacherOfflineData: authLifecycleMocks.clearTeacherData,
  };
});
vi.mock("./attendanceOffline", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    hasUnsyncedAttendanceChanges:
      authLifecycleMocks.hasUnsyncedAttendance,
  };
});

import Login from "../pages/Login";
import Sidebar from "../navigation/Sidebar";
import {
  saveLastKnownTeacherIdentity,
  teacherIdentityStorageKey,
} from "./authIdentity";

function setOnlineHint(value) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("Teacher authentication offline lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authLifecycleMocks.hasUnsyncedAttendance.mockResolvedValue(false);
    authLifecycleMocks.clearTeacherData.mockResolvedValue(undefined);
    localStorage.clear();
    setOnlineHint(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("offline login is blocked clearly without making a request", () => {
    setOnlineHint(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("NIP"), {
      target: { value: "2026001001" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "GuruDemo2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Login baru tidak tersedia saat offline"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("successful login stores stable identity separately from the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 9,
        access_token: "teacher-token",
        ClassId: 3,
      }),
    }));
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("NIP"), {
      target: { value: "2026001001" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "GuruDemo2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByText("Dashboard");
    expect(localStorage.getItem("access_token")).toBe("teacher-token");
    expect(JSON.parse(localStorage.getItem(teacherIdentityStorageKey))).toEqual({
      id: 9,
      name: "",
    });
  });

  test("logout clears only active Teacher offline records and local session", async () => {
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Sidebar />} />
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);
    await waitFor(() => {
      expect(authLifecycleMocks.clearTeacherData).toHaveBeenCalledWith(9);
    });
    await screen.findByText("Login screen");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem(teacherIdentityStorageKey)).toBeNull();
  });

  test("logout with pending Attendance asks for confirmation", async () => {
    authLifecycleMocks.hasUnsyncedAttendance.mockResolvedValue(true);
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
    render(<MemoryRouter><Sidebar /></MemoryRouter>);

    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Masih ada perubahan kehadiran yang belum disinkronkan."
    );
    expect(authLifecycleMocks.clearTeacherData).not.toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBe("legacy-token");
  });

  test("Tetap masuk closes confirmation without clearing session", async () => {
    authLifecycleMocks.hasUnsyncedAttendance.mockResolvedValue(true);
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);

    fireEvent.click(await screen.findByRole("button", {
      name: "Tetap masuk",
    }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(authLifecycleMocks.clearTeacherData).not.toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBe("legacy-token");
  });

  test("confirmed logout clears local changes before ending session", async () => {
    authLifecycleMocks.hasUnsyncedAttendance.mockResolvedValue(true);
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Sidebar />} />
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);

    fireEvent.click(await screen.findByRole("button", {
      name: "Hapus perubahan lokal dan keluar",
    }));

    await waitFor(() => {
      expect(authLifecycleMocks.clearTeacherData).toHaveBeenCalledWith(9);
    });
    await screen.findByText("Login screen");
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
