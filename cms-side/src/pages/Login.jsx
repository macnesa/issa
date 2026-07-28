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
    <main className="teacher-login">
      <section className="teacher-access-record">
        <div className="teacher-access-record__identity" aria-labelledby="teacher-login-title">
          <div className="teacher-access-record__seal">
            <img src={issaLogo} alt="ISSA" />
          </div>
          <p className="teacher-access-record__index">Teacher workspace · record 01</p>
          <h1 id="teacher-login-title">Ruang kerja record siswa</h1>
          <p>Akses untuk mencatat dan meninjau perkembangan siswa di kelas Anda.</p>
        </div>
        <div className="teacher-access-record__form">
          <div className="teacher-access-record__form-header">
            <p className="teacher-access-record__form-kicker">Staff access</p>
            <h2>Masuk ke workspace</h2>
            <p>Gunakan NIP dan password yang terdaftar.</p>
          </div>
          <form onSubmit={handleTeacherLoginSubmit} className="teacher-access-record__fields">
            <TextField id="teacher-nip" label="NIP" required autoComplete="username" type="text" name="NIP" value={loginCredentials.NIP} onChange={handleTeacherLoginInputChange} placeholder="Masukkan NIP" />
            <TextField id="teacher-password" label="Password" required autoComplete="current-password" type="password" name="password" value={loginCredentials.password} onChange={handleTeacherLoginInputChange} placeholder="Masukkan password" />
            <PrimaryButton className="teacher-access-record__submit" type="submit" disabled={submitting}>{submitting ? "Memeriksa akun..." : "Masuk"}</PrimaryButton>
            {message && <p role="alert" className="teacher-access-record__error">{message}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
