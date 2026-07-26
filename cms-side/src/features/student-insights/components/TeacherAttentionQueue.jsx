import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import baseUrl from "../../../config/api";
import "./TeacherAttentionQueue.css";

const urgencyLabels = {
  high: "Tinjau segera",
  medium: "Tinjau minggu ini",
  low: "Pantau",
};

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
      boundary: "Pengukuran akademik",
      review: `Pengukuran akademik ${lessonName}.`,
      fact: `Nilai terbaru ${lessonName} adalah ${latestScore}, setelah sebelumnya ${previousScore}. ${getKkmFact(latestScores[0], flag.kkm)}`,
      context: "Satu perubahan nilai belum cukup untuk menjelaskan perkembangan siswa.",
      nextStep: "Tinjau jenis assessment dan observasi proses belajar siswa.",
    };
  }

  if (flag.type === "attendance_attention") {
    return {
      boundary: "Data faktual",
      review: "Perubahan kehadiran dalam 30 hari terakhir.",
      fact: `Kehadiran tercatat ${formatMetric(flag.rate)}% pada ${formatMetric(flag.recordedDays)} hari yang memiliki catatan.`,
      context: "Belum ada catatan mengenai penyebab perubahan kehadiran.",
      nextStep: "Tanyakan kondisi siswa dan keluarga sebelum menentukan dukungan.",
    };
  }

  if (flag.type === "feedback_stale") {
    if (flag.latestObservedAt === null || flag.daysSinceLatest === null) {
      return {
        boundary: "Observasi guru",
        review: "Kelengkapan observasi guru terbaru.",
        fact: "Belum ada catatan perkembangan baru dalam periode yang ditinjau.",
        context: "Konteks perkembangan terbaru belum tersedia dari observasi guru.",
        nextStep: "Tambahkan observasi terbaru ketika terdapat konteks yang cukup.",
      };
    }
    return {
      boundary: "Observasi guru",
      review: "Kelengkapan observasi guru terbaru.",
      fact: `Observasi guru terakhir tercatat ${formatMetric(flag.daysSinceLatest)} hari lalu.`,
      context: "Konteks perkembangan setelah observasi tersebut belum tersedia.",
      nextStep: "Tambahkan observasi terbaru ketika terdapat konteks yang cukup.",
    };
  }

  return {
    boundary: "Interpretasi sistem",
    review: "Catatan perkembangan memerlukan pemeriksaan guru.",
    fact: "Sistem menandai record ini untuk ditinjau.",
    context: "Konteks tambahan belum tersedia dari data ini.",
    nextStep: "Periksa record detail sebelum menentukan tindak lanjut.",
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
        <button type="button" className="teacher-attention-queue__retry" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

function AttentionQueueRow({ item, index }) {
  const presentations = (Array.isArray(item.flags) ? item.flags : [])
    .map(getFlagPresentation);
  const reviews = [...new Set(presentations.map(({ review }) => review))];
  const contexts = [...new Set(presentations.map(({ context }) => context))];
  const nextSteps = [...new Set(
    presentations.map(({ nextStep }) => nextStep)
  )];
  const urgency = urgencyLabels[item.priority] ? item.priority : "low";

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
        <span>NIM {item.student.nim}</span>
      </div>
      <div className="teacher-attention-queue__follow-up">
        <section className="teacher-attention-queue__review">
          <span className="teacher-attention-queue__section-label">
            Perlu ditinjau · Interpretasi sistem
          </span>
          <div>
            <ul>
              {reviews.map((review) => <li key={review}>{review}</li>)}
            </ul>
            <span className="teacher-attention-queue__urgency">
              {urgencyLabels[urgency]}
            </span>
          </div>
        </section>
        <section className="teacher-attention-queue__facts">
          <span className="teacher-attention-queue__section-label">
            Data yang terlihat
          </span>
          <ul>
            {presentations.map((presentation, flagIndex) => (
              <li key={`${presentation.boundary}-${flagIndex}`}>
                <span>{presentation.boundary}</span>
                <p>{presentation.fact}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="teacher-attention-queue__context">
          <span className="teacher-attention-queue__section-label">Konteks</span>
          <ul>
            {contexts.map((context) => <li key={context}>{context}</li>)}
          </ul>
        </section>
        <section className="teacher-attention-queue__next-step">
          <span className="teacher-attention-queue__section-label">
            Langkah berikut
          </span>
          <ul>
            {nextSteps.map((nextStep) => <li key={nextStep}>{nextStep}</li>)}
          </ul>
        </section>
      </div>
      <Link
        className="teacher-attention-queue__action"
        to={`/students/${item.student.id}`}
        aria-label={`Buka Student Detail ${item.student.name}`}
      >
        Buka detail
      </Link>
    </li>
  );
}

export default function TeacherAttentionQueue() {
  const [status, setStatus] = useState("loading");
  const [attentionQueue, setAttentionQueue] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const initialRequestStarted = useRef(false);

  const loadAttentionQueue = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

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

      setAttentionQueue(Array.isArray(responseBody) ? responseBody : []);
      setStatus("success");
    } catch (requestError) {
      setErrorMessage(
        requestError?.message || "Daftar tinjauan siswa tidak dapat dimuat."
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (initialRequestStarted.current) return;
    initialRequestStarted.current = true;
    loadAttentionQueue();
  }, [loadAttentionQueue]);

  return (
    <section
      className="teacher-attention-queue"
      aria-labelledby="teacher-attention-queue-title"
      aria-busy={status === "loading"}
    >
      <header className="teacher-attention-queue__header">
        <div>
          <p className="teacher-attention-queue__taxonomy">Tindak lanjut</p>
          <h2 id="teacher-attention-queue-title">Perlu ditinjau</h2>
          <p>
            Daftar tindak lanjut berdasarkan data kehadiran, pengukuran akademik,
            dan observasi guru.
          </p>
        </div>
        {status === "success" && attentionQueue.length > 0 && (
          <span className="teacher-attention-queue__count">
            {attentionQueue.length} tindak lanjut
          </span>
        )}
      </header>

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
    </section>
  );
}
