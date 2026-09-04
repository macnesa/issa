import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const loginMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  submitDemo: vi.fn(() => ({ type: "demo-login" })),
  submitNormal: vi.fn((payload) => ({ type: "normal-login", payload })),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => loginMocks.dispatch,
}));
vi.mock("../store/actions/actionCreator", () => ({
  submitParentDemoLogin: loginMocks.submitDemo,
  submitParentLogin: loginMocks.submitNormal,
}));

import LoginPage from "./Login";

describe("Parent login demo action", () => {
  beforeEach(() => vi.clearAllMocks());

  test("introduces the child's learning without design jargon and keeps labeled sign-in controls", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Ikuti cerita belajar anak." })).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByLabelText("NIM siswa")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  });

  test("links to Teacher CMS from the login header in a new tab", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    expect(screen.getByRole("link", {
      name: "Buka Teacher CMS di tab baru",
    })).toHaveAttribute("href", "https://issa-cms.macnesa.com");
    expect(screen.getByRole("link", {
      name: "Buka Teacher CMS di tab baru",
    })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", {
      name: "Buka Teacher CMS di tab baru",
    })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("prevents duplicate demo submissions while the request is pending", () => {
    loginMocks.dispatch.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    const demoButton = screen.getByRole("button", {
      name: "Lihat Demo Parent",
    });
    fireEvent.click(demoButton);
    fireEvent.click(demoButton);

    expect(loginMocks.submitDemo).toHaveBeenCalledTimes(1);
    expect(loginMocks.dispatch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", {
      name: "Membuka demo…",
    })).toBeDisabled();
  });

  test("renders public-demo errors in the existing login error area", async () => {
    loginMocks.dispatch.mockRejectedValue({
      message: "Demo Parent sedang tidak tersedia.",
    });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", {
      name: "Lihat Demo Parent",
    }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demo Parent sedang tidak tersedia."
    );
  });

  test("preserves normal credential login behavior", async () => {
    loginMocks.dispatch.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("NIM siswa"), {
      target: { value: "12001" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "rahasia" },
    });
    fireEvent.click(screen.getByLabelText("Saya adalah orang tua"));
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => {
      expect(loginMocks.submitNormal).toHaveBeenCalledWith({
        NIM: "12001",
        password: "rahasia",
      });
    });
  });
});
