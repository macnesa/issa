import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../config/api";
import { PrimaryButton } from "../shared/ui/ui";
import TextField from "../shared/ui/form-controls/TextField";
import issaLogo from "../../assets/img/logo.png";
import "../features/authentication/teacher-login.css";
import {
  saveLastKnownTeacherIdentity,
} from "../offline-workspace/authIdentity";

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
    if (!navigator.onLine) {
      setMessage(
        "Login baru tidak tersedia saat offline. Hubungkan perangkat lalu coba lagi."
      );
      return;
    }
    setSubmitting(true);
    fetch(`${baseUrl}/teachers/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginCredentials) })
      .then(async (response) => {
        const loginResponse = await response.json();
        if (!response.ok) throw new Error(loginResponse.msg || "Login gagal.");
        return loginResponse;
      })
      .then((loginResponse) => {
        localStorage.setItem("access_token", loginResponse.access_token);
        saveLastKnownTeacherIdentity({ id: loginResponse.id });
        window.dispatchEvent(new Event("issa:teacher-identity-changed"));
        navigate("/");
      })
      .catch((error) => setMessage(
        !navigator.onLine
          ? "Login baru tidak tersedia saat offline. Hubungkan perangkat lalu coba lagi."
          : error.message || "Login gagal."
      ))
      .finally(() => setSubmitting(false));
  };

  return (
    <main className="teacher-login relative grid min-h-[100svh] place-items-center overflow-hidden px-4 py-6 sm:px-6">
      <section className="teacher-access-record relative z-10 grid w-full max-w-[67rem] overflow-hidden">
        <div className="teacher-access-record__identity min-w-0" aria-labelledby="teacher-login-title">
          <div className="teacher-access-record__seal relative z-10">
            <img src={issaLogo} alt="ISSA" />
          </div>
          <p className="teacher-access-record__index relative z-10 uppercase">Teacher workspace · record 01</p>
          <h1 id="teacher-login-title" className="relative z-10">Ruang kerja record siswa</h1>
          <p className="relative z-10">Akses untuk mencatat dan meninjau perkembangan siswa di kelas Anda.</p>
        </div>
        <div className="teacher-access-record__form min-w-0">
        <div className="teacher-access-record__form-header pl-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#356d8d]">Staff access</p><h2 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">Masuk ke workspace</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Gunakan NIP dan password yang terdaftar.</p></div>
        <form onSubmit={handleTeacherLoginSubmit} className="mt-7 space-y-4">
          <TextField id="teacher-nip" label="NIP" required autoComplete="username" type="text" name="NIP" value={loginCredentials.NIP} onChange={handleTeacherLoginInputChange} placeholder="Masukkan NIP" />
          <TextField id="teacher-password" label="Password" required autoComplete="current-password" type="password" name="password" value={loginCredentials.password} onChange={handleTeacherLoginInputChange} placeholder="Masukkan password" />
          <PrimaryButton className="w-full" type="submit" disabled={submitting}>{submitting ? "Memeriksa akun..." : "Masuk"}</PrimaryButton>
          {message && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{message}</p>}
        </form></div>
      </section>
    </main>
  );
}
