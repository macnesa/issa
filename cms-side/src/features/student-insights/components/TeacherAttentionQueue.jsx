import { tw } from "../../../shared/ui/tw";
import { useCallback, useEffect, useRef, useState } from "react";
import baseUrl from "../../../config/api";
import {
  ButtonLink,
  SecondaryButton,
  SectionHeader,
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
  if (!Number.isFinite(numericKkm)) return "KKM belum tersedia.";
  if (!Number.isFinite(numericScore)) return `KKM ${formatMetric(kkm)}.`;
  if (numericScore > numericKkm) return `Masih di atas KKM ${formatMetric(kkm)}.`;
  if (numericScore === numericKkm) return `Tepat memenuhi KKM ${formatMetric(kkm)}.`;
  return `Di bawah KKM ${formatMetric(kkm)}.`;
}

function getFlagPresentation(flag) {
  if (flag.type === "academic_attention") {
    const lessonName = flag.lessonName || "Pelajaran";
    const latestScores = Array.isArray(flag.latestScores) ? flag.latestScores : [];
    return {
      label: "Penilaian",
      reason: `${lessonName}: ${formatMetric(latestScores[0])} setelah ${formatMetric(latestScores[1])}. ${getKkmFact(latestScores[0], flag.kkm)}`,
    };
  }

  if (flag.type === "attendance_attention") {
    return {
      label: "Kehadiran",
      reason: `${formatMetric(flag.rate)}% pada ${formatMetric(flag.recordedDays)} hari tercatat dalam 30 hari terakhir.`,
    };
  }

  if (flag.type === "feedback_stale") {
    return {
      label: "Feedback",
      reason: flag.latestObservedAt === null || flag.daysSinceLatest === null
        ? "Belum ada feedback guru baru dalam periode yang ditinjau."
        : `Feedback guru terakhir ${formatMetric(flag.daysSinceLatest)} hari lalu.`,
    };
  }

  return {
    label: "Tinjauan",
    reason: "Data siswa ini ditandai untuk diperiksa guru.",
  };
}

function AttentionQueueSkeleton() {
  return (
    <div className={tw("teacher-attention-queue__skeleton divide-y divide-issa-border border-y border-issa-border")} aria-label="Memuat siswa yang perlu ditinjau">
      {[0, 1, 2].map((rowIndex) => (
        <div className={tw("grid min-h-[5.75rem] grid-cols-[3rem_minmax(0,_1fr)_6rem] items-center gap-4 py-4 max-sm:grid-cols-[3rem_minmax(0,_1fr)]")} key={rowIndex}>
          <span className={tw("h-11 w-11 rounded-lg bg-issa-disabled [animation:attention-ledger-loading_1.4s_ease-in-out_infinite_alternate] motion-reduce:[animation:none]")} />
          <span className={tw("grid gap-2")}><span className={tw("h-4 w-36 rounded bg-issa-disabled [animation:attention-ledger-loading_1.4s_ease-in-out_infinite_alternate] motion-reduce:[animation:none]")} /><span className={tw("h-3 w-[80%] rounded bg-issa-disabled [animation:attention-ledger-loading_1.4s_ease-in-out_infinite_alternate] motion-reduce:[animation:none]")} /></span>
          <span className={tw("h-9 rounded bg-issa-disabled max-sm:hidden [animation:attention-ledger-loading_1.4s_ease-in-out_infinite_alternate] motion-reduce:[animation:none]")} />
        </div>
      ))}
    </div>
  );
}

function AttentionQueueMessage({ tone, title, description, onRetry }) {
  return (
    <div className={tw("grid min-h-28 items-center border-y border-issa-border py-5 sm:grid-cols-[minmax(0,_1fr)_auto] sm:gap-6", tone === "error" && "text-issa-danger")}>
      <div>
        <strong className={tw("text-body font-semibold text-issa-text")}>{title}</strong>
        <p className={tw("mt-1 max-w-[44rem] text-supporting leading-relaxed text-issa-muted")}>{description}</p>
      </div>
      {onRetry && <SecondaryButton compact type="button" className={tw("mt-4 sm:mt-0")} onClick={onRetry}>Coba lagi</SecondaryButton>}
    </div>
  );
}

function AttentionQueueRow({ item }) {
  const flags = Array.isArray(item.flags) ? item.flags : [];
  const presentations = (flags.length ? flags : [{}]).map(getFlagPresentation).slice(0, 3);
  const urgency = urgencyLevels.has(item.priority) ? item.priority : "low";
  const initial = String(item.student.name || "S").slice(0, 1).toUpperCase();

  return (
    <li className={tw("group relative grid min-h-[6.25rem] grid-cols-[3.25rem_minmax(10rem,_0.48fr)_minmax(0,_1.52fr)_auto] items-start gap-4 py-4 transition-colors duration-fast hover:bg-[color-mix(in_srgb,var(--issa-surface-subtle)_48%,transparent)] [&+&]:border-t [&+&]:border-issa-border max-lg:grid-cols-[3.25rem_minmax(0,_1fr)] motion-reduce:transition-none")} data-urgency={urgency}>
      <span className={tw("absolute left-0 top-5 h-2 w-2 -translate-x-[calc(50%_+_1px)] rounded-full bg-issa-info data-[urgency=high]:bg-issa-danger data-[urgency=medium]:bg-issa-warning")} data-urgency={urgency} aria-hidden="true" />
      {item.student.photo ? <img className={tw("h-11 w-11 rounded-lg bg-issa-subtle object-cover ring-1 ring-issa-border")} src={item.student.photo} alt="" /> : <span className={tw("grid h-11 w-11 place-items-center rounded-lg bg-issa-subtle text-supporting font-semibold text-issa-text ring-1 ring-issa-border")} aria-hidden="true">{initial}</span>}
      <div className={tw("min-w-0 pt-0.5")}>
        <strong className={tw("block truncate text-table font-semibold text-issa-text")}>{item.student.name}</strong>
        <p className={tw("mt-1 text-metadata text-issa-muted")}>{presentations.length} alasan untuk ditinjau</p>
      </div>
      <ul className={tw("m-0 min-w-0 list-none p-0 max-lg:col-start-2")}>
        {presentations.map((presentation, index) => (
          <li key={`${presentation.label}-${index}`} className={tw("grid min-w-0 gap-1 py-1.5 first:pt-0 [&+&]:border-t [&+&]:border-issa-border")}>
            <span className={tw("text-metadata font-semibold text-issa-muted")}>{presentation.label}</span>
            <span className={tw("text-supporting leading-relaxed text-issa-text")}>{presentation.reason}</span>
          </li>
        ))}
      </ul>
      <ButtonLink compact className={tw("max-lg:col-start-2 max-lg:justify-self-start max-sm:w-full")} to={`/students/${item.student.id}`} aria-label={`Tinjau siswa ${item.student.name}`}>Buka siswa</ButtonLink>
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
        headers: { access_token: localStorage.access_token },
      });
      const responseBody = await response.json();
      if (!response.ok) throw new Error(responseBody.msg || "Daftar tinjauan siswa tidak dapat dimuat.");

      const nextAttentionQueue = Array.isArray(responseBody) ? responseBody : [];
      setAttentionQueue(nextAttentionQueue);
      onCountChange(nextAttentionQueue.length);
      setStatus("success");
    } catch (requestError) {
      onCountChange(null);
      setErrorMessage(requestError?.message || "Daftar tinjauan siswa tidak dapat dimuat.");
      setStatus("error");
    }
  }, [onCountChange]);

  useEffect(() => {
    if (initialRequestStarted.current) return;
    initialRequestStarted.current = true;
    loadAttentionQueue();
  }, [loadAttentionQueue]);

  return (
    <section id="teacher-attention-queue-title" className={tw("teacher-attention-queue mb-9")} aria-busy={status === "loading"}>
      <div className={tw("mb-4 flex items-end justify-between gap-5 max-sm:items-start")}>
        <SectionHeader eyebrow="Perhatian" title="Perlu ditinjau" />
        {status === "success" && attentionQueue.length > 0 && <span className={tw("shrink-0 pb-1 text-metadata font-semibold tabular-nums text-issa-muted")}>{attentionQueue.length} siswa</span>}
      </div>
      {status === "loading" && <AttentionQueueSkeleton />}
      {status === "error" && <AttentionQueueMessage tone="error" title="Catatan tinjauan belum tersedia" description={errorMessage} onRetry={loadAttentionQueue} />}
      {status === "success" && attentionQueue.length === 0 && <AttentionQueueMessage tone="empty" title="Tidak ada siswa yang perlu ditinjau saat ini." description="Belum ada perubahan data yang memenuhi rule tinjauan." />}
      {status === "success" && attentionQueue.length > 0 && <ol className={tw("border-y border-issa-border pl-1 [max-height:34rem] overflow-y-auto overscroll-contain")}>{attentionQueue.map((item) => <AttentionQueueRow key={item.student.id} item={item} />)}</ol>}
    </section>
  );
}
