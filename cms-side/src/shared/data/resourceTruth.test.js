import {
  RESOURCE_PROVENANCE,
  RESOURCE_STATUS,
  resourceError,
  resourceFromData,
  resourceLoading,
  resourcePartial,
  resourceUnavailable,
  summarizeResourceSet,
} from "./resourceTruth";

describe("resourceTruth", () => {
  test("membedakan empty dari known data", () => {
    expect(resourceFromData([]).status).toBe(RESOURCE_STATUS.EMPTY);
    expect(resourceFromData([{ id: 1 }]).status).toBe(RESOURCE_STATUS.KNOWN);
  });

  test("snapshot dapat membawa data sekaligus tetap partial", () => {
    const resource = resourcePartial([{ id: 1 }], {
      provenance: RESOURCE_PROVENANCE.SNAPSHOT,
      reason: "Snapshot offline",
    });

    expect(resource.status).toBe(RESOURCE_STATUS.PARTIAL);
    expect(resource.provenance).toBe(RESOURCE_PROVENANCE.SNAPSHOT);
    expect(resource.data).toHaveLength(1);
  });

  test("unavailable tidak berubah menjadi empty", () => {
    const resource = resourceUnavailable({
      data: [],
      reason: "Tidak disimpan dalam snapshot offline",
    });

    expect(resource.status).toBe(RESOURCE_STATUS.UNAVAILABLE);
    expect(resource.data).toEqual([]);
  });

  test("composite tetap loading bila belum ada data usable dan satu sumber masih berjalan", () => {
    const composite = summarizeResourceSet({
      journal: resourceLoading({ data: [] }),
      evidence: resourceError("Gagal"),
    });

    expect(composite.status).toBe(RESOURCE_STATUS.LOADING);
    expect(composite.meta.sourceStatuses).toEqual({
      journal: RESOURCE_STATUS.LOADING,
      evidence: RESOURCE_STATUS.ERROR,
    });
  });

  test("composite menjadi partial ketika satu sumber gagal tetapi sumber lain tersedia", () => {
    const composite = summarizeResourceSet({
      journal: resourceFromData([{ id: 1 }]),
      evidence: resourceError("Gagal"),
      feedback: resourceFromData([]),
    });

    expect(composite.status).toBe(RESOURCE_STATUS.PARTIAL);
    expect(composite.meta.sourceStatuses).toEqual({
      journal: RESOURCE_STATUS.KNOWN,
      evidence: RESOURCE_STATUS.ERROR,
      feedback: RESOURCE_STATUS.EMPTY,
    });
  });
});
