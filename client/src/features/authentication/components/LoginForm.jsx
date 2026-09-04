import { useState } from 'react';
import CheckboxField from '../../../shared/ui/form-controls/CheckboxField';
import TextField from '../../../shared/ui/form-controls/TextField';
import { Button } from '../../../shared/ui/ui';
import '../../../shared/ui/form-controls/form-controls.css';

export default function LoginForm({
  error,
  isDemoSubmitting,
  isSubmitting,
  onChange,
  onDemoLogin,
  onSubmit,
}) {
  const [isParentConfirmed, setIsParentConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState('');

  function handleParentConfirmationChange(checked) {
    setIsParentConfirmed(checked);
    if (checked) setConfirmationError('');
  }

  function handleLoginFormSubmit(event) {
    if (!isParentConfirmed) {
      event.preventDefault();
      setConfirmationError('Konfirmasikan bahwa Anda adalah orang tua.');
      return;
    }
    onSubmit(event);
  }

  return (
    <main className="login-page">
      <div className="login-frame">
        <header className="login-brand">
          <div className="login-brand__identity">
            <span aria-hidden="true" className="login-brand__mark">
              <img src="/issa-logo-white.png" alt="" />
            </span>
            <div className="login-brand__copy">
              <strong>ISSA Parent</strong>
              <span>Jendela perkembangan anak</span>
            </div>
          </div>
          <a
            aria-label="Buka Teacher CMS di tab baru"
            className="login-brand__utility"
            href="https://issa-cms.macnesa.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="login-brand__utility-label">Untuk guru</span>
            <span className="login-brand__utility-desktop">
              Buka Teacher CMS ↗
            </span>
            <span className="login-brand__utility-mobile">CMS Guru ↗</span>
          </a>
        </header>

        <div className="login-composition">
          <section className="login-context">
            <p>Akses orang tua</p>
            <h1>Ikuti cerita belajar anak.</h1>
            <span>
              Kabar dari guru, hasil karya, dan jadwal sekolah anak dalam satu tempat.
            </span>
          </section>

          <form
            onSubmit={handleLoginFormSubmit}
            aria-busy={isSubmitting}
            aria-labelledby="parent-login-title"
            className="login-panel"
          >
            <header>
              <h2 id="parent-login-title">Masuk</h2>
              <p>Gunakan NIM siswa dan password yang telah terdaftar.</p>
            </header>

            <div className="login-panel__body">
              <TextField
                id="nim"
                label="NIM siswa"
                name="NIM"
                type="text"
                inputMode="numeric"
                placeholder="Masukkan NIM siswa"
                autoComplete="username"
                onChange={onChange}
                disabled={isSubmitting}
                required
              />
              <TextField
                id="password"
                label="Password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                onChange={onChange}
                disabled={isSubmitting}
                required
              />

              <CheckboxField
                id="parent-role"
                label="Saya adalah orang tua"
                checked={isParentConfirmed}
                onChange={handleParentConfirmationChange}
                error={confirmationError}
                disabled={isSubmitting}
                required
              />

              {error && <p role="alert" className="login-panel__error">{error}</p>}

              <Button disabled={isSubmitting || isDemoSubmitting} type="submit">
                {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting || isDemoSubmitting}
                onClick={onDemoLogin}
              >
                {isDemoSubmitting ? 'Membuka demo…' : 'Lihat Demo Parent'}
              </Button>

              <small>
                Dengan melanjutkan, Anda menyetujui Ketentuan Platform dan
                Kebijakan Privasi ISSA.
              </small>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
