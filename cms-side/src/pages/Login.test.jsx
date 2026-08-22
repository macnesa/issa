import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Dashboard tujuan</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login form contracts", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("keeps username/password labels, autocomplete, and submit payload", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "teacher-token",
        id: 12,
      }),
    });
    renderLogin();

    const nip = screen.getByLabelText("NIP");
    const password = screen.getByLabelText("Password");
    expect(nip).toHaveAttribute("autocomplete", "username");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");

    fireEvent.change(nip, { target: { value: "198765" } });
    fireEvent.change(password, { target: { value: "rahasia" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls[0][0]).toMatch(/\/teachers\/login$/);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      NIP: "198765",
      password: "rahasia",
    });
    expect(await screen.findByText("Dashboard tujuan")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBe("teacher-token");
  });

  test("keeps public-demo access separate from credential submission", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "demo-token",
        id: 77,
      }),
    });
    renderLogin();

    fireEvent.click(screen.getByRole("button", {
      name: "Jelajahi Demo CMS",
    }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls[0][0]).toMatch(/\/teachers\/demo-login$/);
    expect(fetch.mock.calls[0][1]).toEqual({ method: "POST" });
    expect(await screen.findByText("Dashboard tujuan")).toBeInTheDocument();
  });

  test("renders authentication failures through the shared Flowbite notice", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "NIP atau password tidak valid." }),
    });
    renderLogin();

    fireEvent.change(screen.getByLabelText("NIP"), {
      target: { value: "198765" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "keliru" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("NIP atau password tidak valid.");
    expect(alert).toHaveClass("issa-inline-notice--danger");
  });
});
