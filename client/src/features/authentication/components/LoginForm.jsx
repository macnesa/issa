export default function LoginForm({ error, isSubmitting, onChange, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="issa-login__form relative z-10 grid min-w-0 content-center gap-[1.15rem] overflow-visible max-[767px]:gap-[0.76rem]"
    >
      <div className="border-l-[0.28rem] border-[#6bbfbc] pl-[0.95rem] max-[767px]:pl-[0.7rem]">
        <p className="m-0 text-[0.72rem] font-[850] uppercase tracking-[0.15em] text-[#356d8d] max-[767px]:text-[0.61rem] max-[767px]:tracking-[0.13em]">Parent access</p>
        <h1 className="page-title mt-[0.3rem] text-[clamp(1.7rem,3.2vw,2.2rem)] max-[767px]:mt-[0.22rem] max-[767px]:text-[clamp(1.875rem,7.7vw,1.98rem)] max-[767px]:leading-[1.04]">Masuk ke akun parent</h1>
        <p className="page-supporting-text mt-[0.45rem] max-[767px]:mt-[0.3rem] max-[767px]:text-[0.94rem] max-[767px]:leading-[1.38]">Gunakan NIM dan password yang terdaftar.</p>
      </div>

      <div className="grid gap-[0.88rem] max-[767px]:gap-[0.68rem]">
        <div>
          <label htmlFor="nim" className="form-label text-[#315f62] max-[767px]:text-[0.84rem]">NIM</label>
          <input
            onChange={onChange}
            name="NIM"
            type="text"
            inputMode="numeric"
            id="nim"
            placeholder="Masukkan NIM"
            className="form-input mt-1.5 rounded-[0.72rem_0.4rem_0.72rem_0.4rem] border-[#c8dce7] bg-white px-[0.78rem] py-[0.7rem] focus:border-[#356d8d] focus:shadow-[0_0_0_3px_rgba(107,191,188,0.25)] max-[767px]:min-h-[3.5rem] max-[767px]:px-[0.78rem] max-[767px]:py-[0.66rem] max-[767px]:text-[0.95rem]"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label text-[#315f62] max-[767px]:text-[0.84rem]">Password</label>
          <input
            onChange={onChange}
            type="password"
            name="password"
            id="password"
            placeholder="Masukkan password"
            className="form-input mt-1.5 rounded-[0.72rem_0.4rem_0.72rem_0.4rem] border-[#c8dce7] bg-white px-[0.78rem] py-[0.7rem] focus:border-[#356d8d] focus:shadow-[0_0_0_3px_rgba(107,191,188,0.25)] max-[767px]:min-h-[3.5rem] max-[767px]:px-[0.78rem] max-[767px]:py-[0.66rem] max-[767px]:text-[0.95rem]"
            required
          />
        </div>
      </div>

      <div aria-live="polite">
        {error && <p className="m-0 rounded-[0.72rem_0.4rem_0.72rem_0.4rem] bg-[var(--issa-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--issa-danger)]" role="alert">{error}</p>}
      </div>

      <label className="issa-login__role flex min-h-12 items-center gap-3 px-3 py-3 text-sm text-[var(--issa-text-secondary)] max-[767px]:min-h-[2.75rem] max-[767px]:py-[0.56rem] max-[767px]:text-[0.85rem]">
        <input id="parent-role" type="checkbox" name="parent-role" required className="issa-login__role-check h-4 w-4 accent-[var(--issa-primary)]" />
        <span>Saya adalah parent</span>
      </label>

      <p className="m-0 text-center text-[0.72rem] leading-[1.5] text-[var(--issa-text-muted)] max-[767px]:text-[0.66rem] max-[767px]:leading-[1.42]">Dengan melanjutkan, saya menyetujui Ketentuan Platform dan Kebijakan Privasi ISSA.</p>

      <button disabled={isSubmitting} type="submit" className="primary-button min-h-[2.8rem] w-full rounded-[0.72rem_0.4rem_0.72rem_0.4rem] bg-[#245b70] shadow-[0.22rem_0.24rem_0_rgba(23,62,82,0.15)] hover:bg-[#173e52] max-[767px]:min-h-12">
        {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
      </button>
    </form>
  );
}
