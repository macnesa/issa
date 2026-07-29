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

function unsignedTeacherToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
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

  test("one-click demo login sends no credentials or identity selectors", async () => {
    const demoToken = unsignedTeacherToken({
      role: "teacher",
      teacherId: 9,
      accessMode: "demo",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 9,
        access_token: demoToken,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Jelajahi Demo CMS",
    }));

    await screen.findByText("Dashboard");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/teachers/demo-login"),
      { method: "POST" }
    );
  });

  test("demo login prevents duplicate requests and exposes its loading state", () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><Login /></MemoryRouter>);

    const demoButton = screen.getByRole("button", {
      name: "Jelajahi Demo CMS",
    });
    fireEvent.click(demoButton);
    fireEvent.click(demoButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", {
      name: "Membuka demo…",
    })).toBeDisabled();
  });

  test("demo login maps rate-limit and unavailable errors factually", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: { code: "publicDemoRateLimitExceeded" },
      }),
    }));
    const { unmount } = render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", {
      name: "Jelajahi Demo CMS",
    }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Batas akses demo telah tercapai. Coba lagi nanti."
    );
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: { code: "publicDemoConfigurationError" },
      }),
    }));
    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", {
      name: "Jelajahi Demo CMS",
    }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demo CMS sedang tidak tersedia."
    );
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
    expect(screen.queryByText("Mode demo")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);
    await waitFor(() => {
      expect(authLifecycleMocks.clearTeacherData).toHaveBeenCalledWith(9);
    });
    await screen.findByText("Login screen");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem(teacherIdentityStorageKey)).toBeNull();
  });

  test("demo logout never reads or clears offline workspace data", async () => {
    localStorage.setItem("access_token", unsignedTeacherToken({
      role: "teacher",
      teacherId: 9,
      accessMode: "demo",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Sidebar />} />
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Mode demo")).toBeInTheDocument();
    expect(screen.getByText("Akses hanya-baca")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Keluar" })[0]);

    await screen.findByText("Login screen");
    expect(authLifecycleMocks.hasUnsyncedAttendance).not.toHaveBeenCalled();
    expect(authLifecycleMocks.clearTeacherData).not.toHaveBeenCalled();
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
