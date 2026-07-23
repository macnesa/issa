import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { act_login } from '../store/actions/actionCreator';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginData, setLoginData] = useState({ NIM: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(() => (
    new URLSearchParams(location.search).get('session') === 'expired'
      ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
      : ''
  ));

  useEffect(() => {
    if (new URLSearchParams(location.search).get('session') === 'expired') {
      setError('Sesi Anda telah berakhir. Silakan masuk kembali.');
    }
  }, [location.search]);

  function updateForm(event) {
    const { name, value } = event.target;
    setLoginData({ ...loginData, [name]: value });
  }

  function triggerLogin(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    dispatch(act_login(loginData))
      .then(() => navigate('/'))
      .catch((loginError) => setError(loginError?.message || 'Tidak dapat masuk. Silakan coba lagi.'))
      .finally(() => setIsSubmitting(false));
  }

  return (
    <main className="issa-login flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <form onSubmit={triggerLogin} className="issa-login__form w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <p className="issa-login__kicker">ISSA PARENT</p>
          <h1 className="page-title mt-1">Masuk ke akun parent</h1>
          <p className="page-supporting-text mt-2">Pantau perkembangan siswa dalam satu tempat.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="nim" className="form-label">NIM</label>
            <input
              onChange={updateForm}
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
              onChange={updateForm}
              type="password"
              name="password"
              id="password"
              placeholder="Masukkan password"
              className="form-input mt-1.5"
              required
            />
          </div>
        </div>

        {error && <p className="rounded-[var(--issa-radius-sm)] bg-[var(--issa-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--issa-danger)]" role="alert">{error}</p>}

        <label className="issa-login__role flex items-center gap-3 px-3 py-3 text-sm text-[var(--issa-text-secondary)]">
          <input id="parent-role" type="radio" name="parent-role" required className="h-4 w-4 accent-[var(--issa-primary)]" />
          <span>Saya adalah parent</span>
        </label>

        <p className="text-center text-xs leading-5 text-[var(--issa-text-muted)]">Dengan melanjutkan, saya menyetujui Ketentuan Platform dan Kebijakan Privasi ISSA.</p>

        <button disabled={isSubmitting} type="submit" className="primary-button w-full">
          {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
