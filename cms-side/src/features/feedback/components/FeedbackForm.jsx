import { FormField, PrimaryButton, SecondaryButton, Surface } from "../../../shared/ui/ui";
import DateTimeField from "../../../shared/ui/form-controls/DateTimeField";

export default function FeedbackForm({ feedback, feedbackInputRef, isDemo = false, observedAt, message, submitting, onAiDraftRequested, onFeedbackChange, onObservedAtChange, onSubmit }) {
  const messageState = message?.toLowerCase().includes("berhasil")
    ? "success"
    : /(gagal|tidak valid|tidak boleh)/i.test(message || "")
      ? "error"
      : message
        ? "notice"
        : "idle";
  const statusToneClasses = {
    success: "border-l-[var(--success)] text-[#065f46]",
    error: "border-l-[var(--danger)] text-[#8b3f37]",
    notice: "border-l-[#d4a63a] text-[#6e531d]",
    idle: "border-l-transparent text-[var(--muted)]",
  };

  return (
    <Surface className="min-w-0 overflow-hidden !border-2 !border-[#d8c985] !rounded-[0.25rem_var(--surface-radius)_0.25rem_0.25rem] !bg-[#fffdf7]">
      <header className="flex min-w-0 items-start justify-between gap-4 border-b border-[#d8c985] bg-[#fff4c6] px-[1.1rem] py-4 max-[639px]:flex-col">
        <div className="min-w-0">
          <p className="m-0 text-[0.66rem] font-[850] uppercase tracking-[0.12em] text-[#745d1e]">
            Final teacher record
          </p>
          <h3 className="mt-1 text-[1.08rem] font-[820] text-[var(--text)]">
            Catat Feedback
          </h3>
          <span className="mt-[0.35rem] block max-w-[54ch] text-[0.78rem] leading-6 text-[#655d47]">
            Isi di bawah tetap menjadi catatan guru dan baru dibagikan setelah disimpan.
          </span>
        </div>
        {onAiDraftRequested && (
          <div className="grid flex-none justify-items-end gap-[0.4rem] border-l border-[#cbb867] pl-4 max-[639px]:w-full max-[639px]:justify-items-stretch max-[639px]:border-l-0 max-[639px]:border-t max-[639px]:pl-0 max-[639px]:pt-3">
            <span className="m-0 text-[0.65rem] font-[750] text-[#745d1e] max-[639px]:text-left">
              Opsional · AI-assisted draft
            </span>
            <SecondaryButton type="button" onClick={onAiDraftRequested}>
              Buat draft dengan AI
            </SecondaryButton>
          </div>
        )}
      </header>
      <form onSubmit={onSubmit} className="grid min-w-0 gap-4 p-[1.15rem] max-[639px]:p-4">
        <FormField
          label="Feedback guru"
          hint="Tinjau isi secara menyeluruh sebelum menyimpan."
        >
          <textarea
            ref={feedbackInputRef}
            id="feedback"
            value={feedback}
            onChange={onFeedbackChange}
            className="issa-native-control issa-native-control--textarea min-h-52 max-w-full resize-y bg-white leading-[1.7] [overflow-wrap:anywhere]"
            rows="8"
          />
        </FormField>
        <DateTimeField
          id="observedAt"
          label="Tanggal observasi"
          value={observedAt}
          onChange={onObservedAtChange}
          optional
          tone="feedback"
        />
        <div className="flex min-w-0 flex-wrap items-center gap-[0.8rem] border-t border-[#e2d8aa] pt-4 max-[639px]:[&>button]:w-full">
          <PrimaryButton type="submit" disabled={submitting || isDemo}>
            {submitting ? "Menyimpan..." : "Simpan Feedback"}
          </PrimaryButton>
          {isDemo && (
            <p className="m-0 min-w-0 flex-[1_1_18rem] text-[0.76rem] font-semibold leading-5 text-[#6e531d]">
              Draft AI belum disimpan. Penyimpanan dinonaktifkan dalam mode demo.
            </p>
          )}
          <p
            role="status"
            aria-live="polite"
            className={[
              "m-0 min-h-5 min-w-0 flex-[1_1_15rem] border-l-[0.2rem]",
              "pl-[0.65rem] text-[0.78rem] font-[650] leading-6",
              statusToneClasses[messageState],
            ].join(" ")}
            data-state={messageState}
          >
            {message}
          </p>
        </div>
      </form>
    </Surface>
  );
}
