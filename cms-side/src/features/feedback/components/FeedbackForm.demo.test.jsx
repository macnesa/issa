import { fireEvent, render, screen } from "@testing-library/react";
import FeedbackForm from "./FeedbackForm";

function renderFeedbackForm(overrides = {}) {
  const props = {
    feedback: "Draft lokal",
    feedbackInputRef: { current: null },
    isDemo: true,
    observedAt: "",
    message: "",
    submitting: false,
    onAiDraftRequested: vi.fn(),
    onFeedbackChange: vi.fn(),
    onObservedAtChange: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    ...overrides,
  };
  render(<FeedbackForm {...props} />);
  return props;
}

describe("Feedback controls in demo mode", () => {
  test("keeps real AI entry and local editing active while save is disabled", () => {
    const props = renderFeedbackForm();

    fireEvent.click(screen.getByRole("button", {
      name: "Buat draf dengan AI",
    }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Draft diubah secara lokal" },
    });

    expect(props.onAiDraftRequested).toHaveBeenCalledTimes(1);
    expect(props.onFeedbackChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", {
      name: "Simpan feedback",
    })).toBeDisabled();
    expect(screen.getByText(
      "Draf AI belum disimpan. Penyimpanan dinonaktifkan dalam mode demo."
    )).toBeInTheDocument();
  });
});
