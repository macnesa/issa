import { useState } from "react";
import CheckboxField from "../../../shared/ui/form-controls/CheckboxField";
import TextField from "../../../shared/ui/form-controls/TextField";
import "../../../shared/ui/form-controls/form-controls.css";

export default function LoginForm({ error, isSubmitting, onChange, onSubmit }) {
  const [isParentConfirmed, setIsParentConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  function handleParentConfirmationChange(checked) {
    setIsParentConfirmed(checked);
    if (checked) setConfirmationError("");
  }

  function handleLoginFormSubmit(event) {
    if (!isParentConfirmed) {
      event.preventDefault();
      setConfirmationError("Konfirmasikan bahwa Anda adalah parent.");
      return;
    }
    onSubmit(event);
  }

  return (
    <form
      onSubmit={handleLoginFormSubmit}
      className="issa-login__form relative z-10 grid min-w-0 content-center gap-[1.15rem] overflow-visible max-[767px]:gap-[0.76rem]"
    >
      <div className="border-l-[0.28rem] border-[#6bbfbc] pl-[0.95rem] max-[767px]:pl-[0.7rem]">
        <p className="m-0 text-[0.72rem] font-[850] uppercase tracking-[0.15em] text-[#356d8d] max-[767px]:text-[0.61rem] max-[767px]:tracking-[0.13em]">Parent access</p>
        <h1 className="page-title mt-[0.3rem] text-[clamp(1.7rem,3.2vw,2.2rem)] max-[767px]:mt-[0.22rem] max-[767px]:text-[clamp(1.875rem,7.7vw,1.98rem)] max-[767px]:leading-[1.04]">Masuk ke akun parent</h1>
        <p className="page-supporting-text mt-[0.45rem] max-[767px]:mt-[0.3rem] max-[767px]:text-[0.94rem] max-[767px]:leading-[1.38]">Gunakan NIM dan password yang terdaftar.</p>
      </div>

      <div className="grid gap-[0.88rem] max-[767px]:gap-[0.68rem]">
        <TextField
            label="NIM"
            onChange={onChange}
            name="NIM"
            type="text"
            inputMode="numeric"
            id="nim"
            placeholder="Masukkan NIM"
            autoComplete="username"
            required
          />

        <TextField
            label="Password"
            onChange={onChange}
            type="password"
            name="password"
            id="password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            required
          />
      </div>

      <div aria-live="polite">
        {error && <p className="m-0 rounded-[0.72rem_0.4rem_0.72rem_0.4rem] bg-[var(--issa-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--issa-danger)]" role="alert">{error}</p>}
      </div>

      <CheckboxField
        id="parent-role"
        label="Saya adalah parent"
        checked={isParentConfirmed}
        onChange={handleParentConfirmationChange}
        error={confirmationError}
        disabled={isSubmitting}
        required
      />

      <p className="m-0 text-center text-[0.72rem] leading-[1.5] text-[var(--issa-text-muted)] max-[767px]:text-[0.66rem] max-[767px]:leading-[1.42]">Dengan melanjutkan, saya menyetujui Ketentuan Platform dan Kebijakan Privasi ISSA.</p>

      <button disabled={isSubmitting} type="submit" className="primary-button min-h-[2.8rem] w-full rounded-[0.72rem_0.4rem_0.72rem_0.4rem] bg-[#245b70] shadow-[0.22rem_0.24rem_0_rgba(23,62,82,0.15)] hover:bg-[#173e52] max-[767px]:min-h-12">
        {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
      </button>
    </form>
  );
}
