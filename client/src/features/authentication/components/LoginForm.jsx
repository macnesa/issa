export default function LoginForm({ error, isSubmitting, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="issa-login__form">
      <div className="issa-login__form-heading">
        <p className="issa-login__form-kicker">Parent access</p>
        <h1 className="page-title">Masuk ke akun parent</h1>
        <p className="page-supporting-text">Gunakan NIM dan password yang terdaftar.</p>
      </div>

      <div className="issa-login__fields">
        <div>
          <label htmlFor="nim" className="form-label">NIM</label>
          <input
            onChange={onChange}
            name="NIM"
            type="text"
            inputMode="numeric"
            id="nim"
            placeholder="Masukkan NIM"
            className="form-input mt-1.5"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input
            onChange={onChange}
            type="password"
            name="password"
            id="password"
            placeholder="Masukkan password"
            className="form-input mt-1.5"
            required
          />
        </div>
      </div>

      <div className="issa-login__message" aria-live="polite">
        {error && <p className="rounded-[var(--issa-radius-sm)] bg-[var(--issa-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--issa-danger)]" role="alert">{error}</p>}
      </div>

      <label className="issa-login__role flex items-center gap-3 px-3 py-3 text-sm text-[var(--issa-text-secondary)]">
        <input id="parent-role" type="checkbox" name="parent-role" required className="issa-login__role-check h-4 w-4 accent-[var(--issa-primary)]" />
        <span>Saya adalah parent</span>
      </label>

      <p className="issa-login__privacy">Dengan melanjutkan, saya menyetujui Ketentuan Platform dan Kebijakan Privasi ISSA.</p>

      <button disabled={isSubmitting} type="submit" className="primary-button w-full">
        {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
      </button>
    </form>
  );
}
