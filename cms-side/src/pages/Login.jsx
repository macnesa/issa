import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../config/api";
import { PrimaryButton } from "../shared/ui/ui";

const inputClassName = "w-full rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--focus)]";

export default function Login() {
  const navigate = useNavigate();
  const [loginCredentials, setLoginCredentials] = useState({ NIP: "", password: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleTeacherLoginInputChange = (event) => setLoginCredentials({ ...loginCredentials, [event.target.name]: event.target.value });

  const handleTeacherLoginSubmit = (event) => {
    void 'ISSA:CMS.AUTH.SUBMIT_TEACHER_LOGIN';
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    fetch(`${baseUrl}/teachers/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginCredentials) })
      .then(async (response) => {
        const loginResponse = await response.json();
        if (!response.ok) throw new Error(loginResponse.msg || "Login gagal.");
        return loginResponse;
      })
      .then((loginResponse) => { localStorage.setItem("access_token", loginResponse.access_token); navigate("/"); })
      .catch((error) => setMessage(error.message || "Login gagal."))
      .finally(() => setSubmitting(false));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page)] px-4 py-8">
      <section className="w-full max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">ISSA</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">Workspace guru</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Masuk untuk melihat dan memperbarui record siswa di kelas Anda.</p></div>
        <form onSubmit={handleTeacherLoginSubmit} className="space-y-5">
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-[var(--text)]">NIP</span><input required autoComplete="username" type="text" name="NIP" value={loginCredentials.NIP} onChange={handleTeacherLoginInputChange} className={inputClassName} placeholder="Masukkan NIP" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-[var(--text)]">Password</span><input required autoComplete="current-password" type="password" name="password" value={loginCredentials.password} onChange={handleTeacherLoginInputChange} className={inputClassName} placeholder="Masukkan password" /></label>
          <PrimaryButton className="w-full" type="submit" disabled={submitting}>{submitting ? "Memeriksa akun..." : "Masuk"}</PrimaryButton>
          {message && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{message}</p>}
        </form>
      </section>
    </main>
  );
}
