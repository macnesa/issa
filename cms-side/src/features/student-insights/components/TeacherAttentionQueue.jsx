import { useCallback, useEffect, useRef, useState } from "react";
import baseUrl from "../../../config/api";
import {
  ButtonLink,
  LedgerShell,
  SecondaryButton,
} from "../../../shared/ui/ui";
import "./TeacherAttentionQueue.css";

const urgencyLevels = new Set(["high", "medium", "low"]);
const ignoreCountChange = () => {};

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

function formatMetric(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numberFormatter.format(numericValue)
    : "—";
}

function getKkmFact(latestScore, kkm) {
  const numericScore = Number(latestScore);
  const numericKkm = Number(kkm);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericKkm)) {
    return `KKM saat ini adalah ${formatMetric(kkm)}.`;
  }
  if (numericScore > numericKkm) {
    return `Nilai masih berada di atas KKM ${formatMetric(kkm)}.`;
  }
  if (numericScore === numericKkm) {
    return `Nilai terbaru memenuhi KKM ${formatMetric(kkm)}.`;
  }
  return `KKM saat ini adalah ${formatMetric(kkm)}.`;
}

function getFlagPresentation(flag) {
  if (flag.type === "academic_attention") {
    const lessonName = flag.lessonName || "pelajaran ini";
    const latestScores = Array.isArray(flag.latestScores)
      ? flag.latestScores
      : [];
    const latestScore = formatMetric(latestScores[0]);
    const previousScore = formatMetric(latestScores[1]);

    return {
      review: `Pengukuran akademik ${lessonName}.`,
      fact: `Nilai terbaru ${lessonName} adalah ${latestScore}, setelah sebelumnya ${previousScore}. ${getKkmFact(latestScores[0], flag.kkm)}`,
      context: "Satu perubahan nilai belum cukup untuk menjelaskan perkembangan siswa.",
    };
  }

  if (flag.type === "attendance_attention") {
    return {
      review: "Perubahan kehadiran dalam 30 hari terakhir.",
      fact: `Kehadiran tercatat ${formatMetric(flag.rate)}% pada ${formatMetric(flag.recordedDays)} hari yang memiliki catatan.`,
      context: "Belum ada catatan mengenai penyebab perubahan kehadiran.",
    };
  }

  if (flag.type === "feedback_stale") {
    if (flag.latestObservedAt === null || flag.daysSinceLatest === null) {
      return {
        review: "Kelengkapan observasi guru terbaru.",
        fact: "Belum ada catatan perkembangan baru dalam periode yang ditinjau.",
        context: "Konteks perkembangan terbaru belum tersedia dari observasi guru.",
      };
    }
    return {
      review: "Kelengkapan observasi guru terbaru.",
      fact: `Observasi guru terakhir tercatat ${formatMetric(flag.daysSinceLatest)} hari lalu.`,
      context: "Konteks perkembangan setelah observasi tersebut belum tersedia.",
    };
  }

  return {
    review: "Catatan perkembangan memerlukan pemeriksaan guru.",
    fact: "Sistem menandai record ini untuk ditinjau.",
    context: "Konteks tambahan belum tersedia dari data ini.",
  };
}

function AttentionQueueSkeleton() {
  return (
    <div className="teacher-attention-queue__skeleton" aria-label="Memuat siswa yang perlu ditinjau">
      {[0, 1, 2].map((rowIndex) => (
        <div className="teacher-attention-queue__skeleton-row" key={rowIndex}>
          <span className="teacher-attention-queue__skeleton-index" />
          <span className="teacher-attention-queue__skeleton-portrait" />
          <span className="teacher-attention-queue__skeleton-identity" />
          <span className="teacher-attention-queue__skeleton-fact" />
          <span className="teacher-attention-queue__skeleton-action" />
        </div>
      ))}
    </div>
  );
}

function AttentionQueueMessage({ tone, title, description, onRetry }) {
  return (
    <div className={`teacher-attention-queue__message teacher-attention-queue__message--${tone}`}>
      <span className="teacher-attention-queue__message-index" aria-hidden="true">—</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {onRetry && (
        <SecondaryButton compact type="button" className="teacher-attention-queue__retry" onClick={onRetry}>
          Coba lagi
        </SecondaryButton>
      )}
    </div>
  );
}

function AttentionQueueRow({ item, index }) {
  const primaryPresentation = getFlagPresentation(
    (Array.isArray(item.flags) ? item.flags : [])[0] || {}
  );
  const urgency = urgencyLevels.has(item.priority) ? item.priority : "low";

  return (
    <li className="teacher-attention-queue__row" data-urgency={urgency}>
      <span className="teacher-attention-queue__index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <img
        className="teacher-attention-queue__portrait"
        src={item.student.photo}
        alt=""
      />
      <div className="teacher-attention-queue__identity">
        <strong>{item.student.name}</strong>
      </div>
      <div className="teacher-attention-queue__follow-up">
        <p className="teacher-attention-queue__review">
          {primaryPresentation.review}
        </p>
        <p className="teacher-attention-queue__fact">
          {primaryPresentation.fact}
        </p>
        {primaryPresentation.context && (
          <p className="teacher-attention-queue__context">
            {primaryPresentation.context}
          </p>
        )}
      </div>
      <ButtonLink
        compact
        className="teacher-attention-queue__action"
        to={`/students/${item.student.id}`}
        aria-label={`Tinjau siswa ${item.student.name}`}
      >
        Tinjau siswa
      </ButtonLink>
    </li>
  );
}

export default function TeacherAttentionQueue({
  onCountChange = ignoreCountChange,
}) {
  const [status, setStatus] = useState("loading");
  const [attentionQueue, setAttentionQueue] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const initialRequestStarted = useRef(false);

  const loadAttentionQueue = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    onCountChange(null);

    try {
      const response = await fetch(`${baseUrl}/teachers/me/attention`, {
        headers: {
          access_token: localStorage.access_token,
        },
      });
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.msg || "Daftar tinjauan siswa tidak dapat dimuat.");
      }

      const nextAttentionQueue = Array.isArray(responseBody) ? responseBody : [];
      setAttentionQueue(nextAttentionQueue);
      onCountChange(nextAttentionQueue.length);
      setStatus("success");
    } catch (requestError) {
      onCountChange(null);
      setErrorMessage(
        requestError?.message || "Daftar tinjauan siswa tidak dapat dimuat."
      );
      setStatus("error");
    }
  }, [onCountChange]);

  useEffect(() => {
    if (initialRequestStarted.current) return;
    initialRequestStarted.current = true;
    loadAttentionQueue();
  }, [loadAttentionQueue]);

  return (
    <LedgerShell
      className="teacher-attention-queue"
      eyebrow="Tindak lanjut"
      title="Perlu ditinjau"
      description="Daftar tindak lanjut berdasarkan data kehadiran, pengukuran akademik, dan observasi guru."
      aria-busy={status === "loading"}
    >
      {status === "success" && attentionQueue.length > 0 && (
        <div className="teacher-attention-queue__summary">
          <span className="teacher-attention-queue__count">
            {attentionQueue.length} tindak lanjut
          </span>
        </div>
      )}

      {status === "loading" && <AttentionQueueSkeleton />}
      {status === "error" && (
        <AttentionQueueMessage
          tone="error"
          title="Catatan tinjauan belum tersedia"
          description={errorMessage}
          onRetry={loadAttentionQueue}
        />
      )}
      {status === "success" && attentionQueue.length === 0 && (
        <AttentionQueueMessage
          tone="empty"
          title="Tidak ada tindak lanjut yang ditandai saat ini."
          description="Belum ada perubahan data yang memenuhi rule tinjauan."
        />
      )}
      {status === "success" && attentionQueue.length > 0 && (
        <ol className="teacher-attention-queue__register">
          {attentionQueue.map((item, index) => (
            <AttentionQueueRow key={item.student.id} item={item} index={index} />
          ))}
        </ol>
      )}
    </LedgerShell>
  );
}
