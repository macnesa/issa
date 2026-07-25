import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import baseUrl from "../../../config/api";
import "./TeacherAttentionQueue.css";

const priorityLabels = {
  high: "Prioritas tinggi",
  medium: "Perlu diperhatikan",
  low: "Perlu diperbarui",
};

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

function getFlagCopy(flag) {
  if (flag.type === "academic_attention") {
    return `Dua nilai terbaru ${flag.lessonName || "pelajaran ini"} berada di bawah KKM ${flag.kkm}.`;
  }

  if (flag.type === "attendance_attention") {
    return `Kehadiran 30 hari berada pada ${numberFormatter.format(flag.rate)}% dari ${flag.recordedDays} catatan.`;
  }

  if (flag.type === "feedback_stale") {
    if (flag.latestObservedAt === null || flag.daysSinceLatest === null) {
      return "Belum memiliki catatan feedback guru.";
    }
    return `Feedback terakhir belum diperbarui selama ${flag.daysSinceLatest} hari.`;
  }

  return null;
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
  const facts = (Array.isArray(item.flags) ? item.flags : [])
    .map(getFlagCopy)
    .filter(Boolean);
  const visibleFacts = facts.slice(0, 2);
  const additionalFactCount = Math.max(0, facts.length - visibleFacts.length);
  const priority = priorityLabels[item.priority] ? item.priority : "low";

  return (
    <li className="teacher-attention-queue__row" data-priority={priority}>
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
      <div className="teacher-attention-queue__priority">
        <span>{priorityLabels[priority]}</span>
      </div>
      <div className="teacher-attention-queue__facts">
        <ul>
          {visibleFacts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
        {additionalFactCount > 0 && (
          <span className="teacher-attention-queue__additional">
            +{additionalFactCount} catatan lainnya
          </span>
        )}
      </div>
      <Link
        className="teacher-attention-queue__action"
        to={`/students/${item.student.id}`}
        aria-label={`Tinjau siswa ${item.student.name}`}
      >
        Tinjau siswa
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
          <p className="teacher-attention-queue__taxonomy">Student insights</p>
          <h2 id="teacher-attention-queue-title">Perlu ditinjau</h2>
          <p>
            Siswa dengan catatan akademik, kehadiran, atau feedback yang perlu diperhatikan.
          </p>
        </div>
        {status === "success" && attentionQueue.length > 0 && (
          <span className="teacher-attention-queue__count">
            {attentionQueue.length} siswa
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
          title="Tidak ada siswa yang perlu ditinjau saat ini."
          description="Record kelas berada dalam kondisi baik atau catatan yang diperlukan telah diperbarui."
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
