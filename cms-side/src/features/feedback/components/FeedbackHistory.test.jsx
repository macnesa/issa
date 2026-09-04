import { render, screen } from "@testing-library/react";
import {
  RESOURCE_PROVENANCE,
  resourceFromData,
  resourcePartial,
  resourceUnavailable,
} from "../../../shared/data/resourceTruth";
import FeedbackHistory from "./FeedbackHistory";

const feedbackRecord = {
  id: 4,
  content: "Ayu mulai lebih konsisten menjelaskan langkah pengerjaannya.",
  observedAt: "2026-09-01",
  createdAt: "2026-09-01T08:00:00.000Z",
  Teacher: { name: "Bu Rina" },
};

describe("FeedbackHistory resource truth", () => {
  test("empty server state menyatakan histori memang kosong", () => {
    render(<FeedbackHistory resource={resourceFromData([])} />);
    expect(screen.getByText("Belum ada histori feedback.")).toBeInTheDocument();
  });

  test("unavailable tidak diubah menjadi empty", () => {
    render(
      <FeedbackHistory
        resource={resourceUnavailable({
          data: [],
          provenance: RESOURCE_PROVENANCE.SNAPSHOT,
          reason: "Histori feedback tidak disimpan dalam snapshot offline minimum.",
        })}
      />
    );

    expect(screen.getByText(/tidak disimpan dalam snapshot offline/i)).toBeInTheDocument();
    expect(screen.queryByText("Belum ada histori feedback.")).not.toBeInTheDocument();
  });

  test("partial tetap menampilkan data sambil mengungkap batas cakupan", () => {
    render(
      <FeedbackHistory
        resource={resourcePartial([feedbackRecord], {
          provenance: RESOURCE_PROVENANCE.SNAPSHOT,
          reason: "Histori yang tersedia mungkin tidak lengkap.",
        })}
      />
    );

    expect(screen.getByText(feedbackRecord.content)).toBeInTheDocument();
    expect(screen.getByText(/mungkin tidak lengkap/i)).toBeInTheDocument();
  });
});
