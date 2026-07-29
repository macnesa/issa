import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import AiNarrativeWorkspace from "./AiNarrativeWorkspace";

const aiWorkspaceMocks = vi.hoisted(() => ({
  generateAiNarrative: vi.fn(),
}));

vi.mock("./aiNarrativeApi", () => ({
  generateAiNarrative: aiWorkspaceMocks.generateAiNarrative,
}));

const groundedDraft = {
  generatedAt: "2026-07-29T10:00:00.000Z",
  student: { id: 7, name: "Ayu" },
  period: { dateFrom: "2026-06-29", dateTo: "2026-07-29" },
  sourceSummary: { journal: 1 },
  sources: [{
    sourceRef: "JRN-1",
    sourceType: "journal",
    label: "Diskusi kelas",
    observedAt: "2026-07-20",
    preview: "Ayu aktif berdiskusi.",
  }],
  narrative: {
    title: "Perkembangan Ayu",
    sections: [{
      sectionType: "summary",
      text: "Ayu aktif berdiskusi.",
      sourceRefs: ["JRN-1"],
      directQuote: null,
    }],
    missingContext: [],
  },
  warnings: [],
};

describe("AI narrative drafting workspace", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    aiWorkspaceMocks.generateAiNarrative.mockResolvedValue(groundedDraft);
  });

  afterAll(() => {
    delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  });

  test("keeps generation, citations, local editing, and handoff active", async () => {
    const onUseFeedback = vi.fn();
    render(
      <AiNarrativeWorkspace
        open
        studentId="7"
        existingFeedback=""
        onClose={vi.fn()}
        onUseFeedback={onUseFeedback}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
    expect(await screen.findByDisplayValue("Perkembangan Ayu"))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "[JRN-1]" }));
    const sourceDetail = screen.getByRole("complementary", {
      name: "Detail sumber JRN-1",
    });
    expect(within(sourceDetail).getByText("Ayu aktif berdiskusi."))
      .toBeInTheDocument();
    expect(within(sourceDetail).getByText("Diskusi kelas"))
      .toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Perkembangan Ayu"), {
      target: { value: "Perkembangan Ayu yang ditinjau" },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Tinjau lalu pindahkan ke Feedback",
    }));

    await waitFor(() => {
      expect(onUseFeedback).toHaveBeenCalledWith(
        expect.stringContaining("Perkembangan Ayu yang ditinjau")
      );
    });
  });

  test("keeps backend and rate-limit messages factual", async () => {
    aiWorkspaceMocks.generateAiNarrative.mockRejectedValue(
      new Error("Batas penggunaan demo telah tercapai. Coba lagi nanti.")
    );
    render(
      <AiNarrativeWorkspace
        open
        studentId="7"
        existingFeedback=""
        onClose={vi.fn()}
        onUseFeedback={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Susun draf" }));
    expect(await screen.findByText(
      "Batas penggunaan demo telah tercapai. Coba lagi nanti."
    )).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" }))
      .toBeInTheDocument();
  });
});
