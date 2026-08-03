import { tw } from "../../../shared/ui/tw";
import { useCallback, useEffect, useRef, useState } from "react";
import baseUrl from "../../../config/api";
import {
  ButtonLink,
  LedgerShell,
  SecondaryButton,
} from "../../../shared/ui/ui";

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
    <div className={tw("teacher-attention-queue__skeleton")} aria-label="Memuat siswa yang perlu ditinjau">
      {[0, 1, 2].map((rowIndex) => (
        <div className={tw("teacher-attention-queue__skeleton-row grid [grid-template-columns:2.75rem_minmax(8.5rem,_0.65fr)_minmax(0,_2fr)_6rem] [min-height:5rem] items-center gap-3 p-4 [&+&]:border-t [&+&]:border-issa-border [&_span]:block [&_span]:rounded-control [&_span]:bg-issa-disabled [&_span]:[animation:attention-ledger-loading_1.4s_ease-in-out_infinite_alternate] max-lg:[grid-template-columns:2.75rem_minmax(0,_1fr)] motion-reduce:[&_span]:[animation:none]")} key={rowIndex}>
          <span className={tw("teacher-attention-queue__skeleton-index hidden")} />
          <span className={tw("teacher-attention-queue__skeleton-portrait w-11 h-11")} />
          <span className={tw("teacher-attention-queue__skeleton-identity [width:82%] [height:1.5rem]")} />
          <span className={tw("teacher-attention-queue__skeleton-fact [width:92%] h-8 max-lg:col-start-2")} />
          <span className={tw("teacher-attention-queue__skeleton-action [width:6rem] h-9 max-lg:col-start-2")} />
        </div>
      ))}
    </div>
  );
}

function AttentionQueueMessage({ tone, title, description, onRetry }) {
  return (
    <div className={tw(
      `teacher-attention-queue__message grid [grid-template-columns:minmax(0,_1fr)_auto] items-center gap-4 border-l-emphasis border-issa-info p-4 bg-issa-subtle max-sm:grid-cols-1 teacher-attention-queue__message--${tone}`,
      tone === "error" && "border-l-issa-danger"
    )}>
      <span className={tw("teacher-attention-queue__message-index hidden")} aria-hidden="true">—</span>
      <div>
        <strong className={tw("text-issa-text text-body")}>{title}</strong>
        <p className={tw("mt-1 text-issa-muted text-supporting")}>{description}</p>
      </div>
      {onRetry && (
        <SecondaryButton compact type="button" className={tw("teacher-attention-queue__retry max-sm:w-full")} onClick={onRetry}>
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
    <li className={tw("teacher-attention-queue__row grid [grid-template-columns:2.75rem_minmax(8.5rem,_0.65fr)_minmax(0,_2fr)_auto] [align-items:start] gap-3 border-l-emphasis border-issa-info p-4 bg-issa-surface [&+&]:border-t [&+&]:border-issa-border data-[urgency=high]:border-l-issa-danger data-[urgency=medium]:border-l-issa-warning max-lg:[grid-template-columns:2.75rem_minmax(0,_1fr)] max-sm:p-3")} data-urgency={urgency}>
      <span className={tw("teacher-attention-queue__index hidden")} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <img
        className={tw("teacher-attention-queue__portrait w-11 h-11 border border-issa-border rounded-control bg-issa-subtle object-cover")}
        src={item.student.photo}
        alt=""
      />
      <div className={tw("teacher-attention-queue__identity min-w-0")}>
        <strong className={tw("text-issa-text text-table font-semibold")}>{item.student.name}</strong>
      </div>
      <div className={tw("teacher-attention-queue__follow-up grid min-w-0 gap-2 pl-4 border-l border-issa-border max-lg:[padding-left:0] max-lg:[border-left:0]")}>
        <p className={tw("teacher-attention-queue__review text-issa-text text-supporting font-bold leading-normal")}>
          {primaryPresentation.review}
        </p>
        <p className={tw("teacher-attention-queue__fact text-issa-muted text-metadata leading-normal")}>
          {primaryPresentation.fact}
        </p>
        {primaryPresentation.context && (
          <p className={tw("teacher-attention-queue__context [border-left:var(--issa-border-width-emphasis)_solid_var(--issa-warning)] pl-2 text-issa-muted text-metadata leading-normal")}>
            {primaryPresentation.context}
          </p>
        )}
      </div>
      <ButtonLink
        compact
        className={tw("teacher-attention-queue__action max-lg:col-start-2 max-lg:[justify-self:start] max-sm:w-full")}
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
      className={tw("teacher-attention-queue mb-6")}
      eyebrow="Tindak lanjut"
      title="Perlu ditinjau"
      description="Daftar tindak lanjut berdasarkan data kehadiran, pengukuran akademik, dan observasi guru."
      aria-busy={status === "loading"}
    >
      {status === "success" && attentionQueue.length > 0 && (
        <div className={tw("teacher-attention-queue__summary flex justify-end [padding:var(--issa-space-3)_var(--issa-space-4)_0]")}>
          <span className={tw("teacher-attention-queue__count text-issa-muted text-metadata font-semibold")}>
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
        <ol className={tw("teacher-attention-queue__register [max-height:30rem] overflow-y-auto overscroll-contain")}>
          {attentionQueue.map((item, index) => (
            <AttentionQueueRow key={item.student.id} item={item} index={index} />
          ))}
        </ol>
      )}
    </LedgerShell>
  );
}
