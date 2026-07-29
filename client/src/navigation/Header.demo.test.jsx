import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../store";
import Header from "./Header";

function unsignedToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

describe("Parent demo header indicator", () => {
  afterEach(() => localStorage.clear());

  test("renders only for the exact demo claim and survives stored-session rendering", () => {
    localStorage.setItem("access_token", unsignedToken({
      accessMode: "demo",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("Mode demo")).toBeInTheDocument();
    expect(screen.getByText("Akses hanya-baca")).toBeInTheDocument();

    localStorage.setItem("access_token", unsignedToken({
      accessMode: "Demo",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText("Mode demo")).not.toBeInTheDocument();
  });
});
