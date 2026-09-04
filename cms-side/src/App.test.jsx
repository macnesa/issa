import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the teacher CMS login when no session exists", async () => {
  localStorage.clear();
  render(<App />);
  expect(await screen.findByRole("heading", {
    name: "Masuk ke workspace",
  })).toBeInTheDocument();
});
