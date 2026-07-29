import {
  AiNarrativeRequestError,
  generateAiNarrative,
} from "./aiNarrativeApi";

const request = {
  dateFrom: "2026-07-01",
  dateTo: "2026-07-29",
  sourceTypes: ["journal"] as const,
  length: "short" as const,
};

describe("AI narrative behavior in demo-compatible sessions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("keeps real draft generation available and returns grounding", async () => {
    localStorage.setItem("access_token", "demo-token");
    const payload = {
      data: {
        generatedAt: "2026-07-29T10:00:00.000Z",
        student: { id: 4, name: "Siswa Demo" },
        period: { dateFrom: request.dateFrom, dateTo: request.dateTo },
        sourceSummary: { journal: 1 },
        sources: [{
          sourceRef: "JRN-1",
          sourceType: "journal",
          label: "Jurnal",
          observedAt: "2026-07-20",
          preview: "Aktif berdiskusi",
        }],
        narrative: {
          title: "Perkembangan belajar",
          sections: [{
            sectionType: "summary",
            text: "Siswa aktif berdiskusi.",
            sourceRefs: ["JRN-1"],
            directQuote: null,
          }],
          missingContext: [],
        },
        warnings: [],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAiNarrative("4", {
      ...request,
      sourceTypes: [...request.sourceTypes],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/students/4/ai/narrative-draft"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result.sources[0].sourceRef).toBe("JRN-1");
    expect(result.narrative.sections[0].sourceRefs).toEqual(["JRN-1"]);
  });

  test("maps demo rate limits to the required message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: { code: "publicDemoRateLimitExceeded" },
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    ));

    await expect(generateAiNarrative("4", {
      ...request,
      sourceTypes: [...request.sourceTypes],
    })).rejects.toEqual(expect.objectContaining({
      name: AiNarrativeRequestError.name,
      message: "Batas penggunaan demo telah tercapai. Coba lagi nanti.",
    }));
  });
});
