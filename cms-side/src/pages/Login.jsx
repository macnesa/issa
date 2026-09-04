import { tw } from "../shared/ui/tw";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import baseUrl from "../config/api";
import {
  InlineNotice,
  PrimaryButton,
  SecondaryButton,
} from "../shared/ui/ui";
import TextField from "../shared/ui/form-controls/TextField";
import issaLogo from "../../assets/img/logo.png";
import { saveLastKnownTeacherIdentity } from "../offline-workspace/authIdentity";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginCredentials, setLoginCredentials] = useState({
    NIP: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  useEffect(() => {
    const sessionReason = new URLSearchParams(location.search).get("session");
    if (sessionReason === "demo-expired") {
      setMessage(
        "Sesi demo telah berakhir. Buka kembali demo untuk melanjutkan."
      );
    } else if (sessionReason === "expired") {
      setMessage("Sesi Anda telah berakhir. Silakan masuk kembali.");
    }
  }, [location.search]);

  const completeLogin = (loginResponse) => {
    localStorage.setItem("access_token", loginResponse.access_token);
    saveLastKnownTeacherIdentity({ id: loginResponse.id });
    window.dispatchEvent(new Event("issa:teacher-identity-changed"));
    navigate("/");
  };

  const parseLoginResponse = async (
    response,
    fallbackMessage,
    { publicDemo = false } = {}
  ) => {
    const loginResponse = await response.json().catch(() => null);
    if (!response.ok) {
      const errorCode = loginResponse?.error?.code || loginResponse?.code;
      if (publicDemo && response.status === 429) {
        throw new Error(
          "Batas akses demo telah tercapai. Coba lagi nanti."
        );
      }
      if (
        publicDemo
        && [
          "publicDemoUnavailable",
          "publicDemoConfigurationError",
        ].includes(errorCode)
      ) {
        throw new Error("Demo CMS sedang tidak tersedia.");
      }
      throw new Error(
        loginResponse?.error?.message
        || loginResponse?.message
        || loginResponse?.msg
        || fallbackMessage
      );
    }
    return loginResponse;
  };

  const handleTeacherLoginInputChange = (event) => {
    const { name, value } = event.target;

    setLoginCredentials((currentCredentials) => ({
      ...currentCredentials,
      [name]: value,
    }));
  };

  const handleTeacherLoginSubmit = (event) => {
    void "ISSA:CMS.AUTH.SUBMIT_TEACHER_LOGIN";

    event.preventDefault();
    setMessage("");

    if (!navigator.onLine) {
      setMessage(
        "Login baru tidak tersedia saat offline. Hubungkan perangkat lalu coba lagi."
      );
      return;
    }

    setSubmitting(true);

    fetch(`${baseUrl}/teachers/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginCredentials),
    })
      .then(async (response) => {
        return parseLoginResponse(response, "Login gagal.");
      })
      .then(completeLogin)
      .catch((error) => {
        setMessage(
          !navigator.onLine
            ? "Login baru tidak tersedia saat offline. Hubungkan perangkat lalu coba lagi."
            : error.message || "Login gagal."
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleTeacherDemoLogin = () => {
    void "ISSA:CMS.AUTH.SUBMIT_TEACHER_DEMO_LOGIN";
    if (demoSubmitting) return;

    setMessage("");
    setDemoSubmitting(true);
    fetch(`${baseUrl}/teachers/demo-login`, { method: "POST" })
      .then((response) => parseLoginResponse(
        response,
        "Demo CMS belum dapat dibuka.",
        { publicDemo: true }
      ))
      .then(completeLogin)
      .catch((error) => {
        setMessage(error.message || "Demo CMS belum dapat dibuka.");
      })
      .finally(() => {
        setDemoSubmitting(false);
      });
  };

  return (
    <main className={tw("min-h-screen bg-issa-page text-issa-text")}>
      <div className={tw("mx-auto grid min-h-screen w-full max-w-[74rem] grid-rows-[auto_1fr] px-5 py-5 sm:px-8 sm:py-7 lg:px-10")}>
        <header className={tw("flex items-center justify-between gap-6 border-b border-issa-border pb-4")}>
          <div className={tw("flex min-w-0 items-center gap-3")}>
            <img src={issaLogo} alt="" className={tw("h-9 w-9 object-contain")} />
            <div className={tw("min-w-0")}>
              <p className={tw("text-label font-semibold text-issa-text")}>ISSA</p>
              <p className={tw("mt-0.5 text-metadata text-issa-muted")}>Ruang kerja guru</p>
            </div>
          </div>
          <span className={tw("text-metadata font-semibold text-issa-muted")}>Akses internal</span>
        </header>

        <section className={tw("grid content-center gap-12 py-10 lg:grid-cols-[minmax(0,_1fr)_minmax(24rem,_27rem)] lg:gap-20")}>
          <div className={tw("max-w-[37rem]")}>
            <p className={tw("text-eyebrow font-semibold text-issa-accent")}>Operasional guru</p>
            <h1 className={tw("mt-3 max-w-[34rem] text-[clamp(2.25rem,4.5vw,4.35rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-issa-text")}>
              Satu ruang kerja untuk melihat kelas, memahami siswa, dan mencatat yang penting.
            </h1>
            <p className={tw("mt-6 max-w-[32rem] text-body leading-relaxed text-issa-muted")}>
              Kehadiran, penilaian, observasi, bukti, dan feedback tetap terhubung pada konteks siswa dan kelas yang sama.
            </p>
            <dl className={tw("mt-10 grid gap-4 border-y border-issa-border py-5 sm:grid-cols-3 sm:divide-x sm:divide-issa-border")}>
              {[
                ["Hari ini", "Lanjutkan pekerjaan yang perlu perhatian sekarang."],
                ["Siswa", "Baca perkembangan siswa tanpa kehilangan konteks roster."],
                ["Kelas", "Kelola kehadiran dan jadwal dari satu konteks."],
              ].map(([term, detail]) => (
                <div key={term} className={tw("min-w-0 sm:px-4 sm:first:pl-0 sm:last:pr-0")}>
                  <dt className={tw("text-label font-semibold text-issa-text")}>{term}</dt>
                  <dd className={tw("mt-1 text-metadata leading-relaxed text-issa-muted")}>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <form onSubmit={handleTeacherLoginSubmit} aria-busy={submitting || demoSubmitting} aria-labelledby="cms-login-title" className={tw("self-center border-y border-issa-border py-6")}>
            <div className={tw("mb-6")}>
              <p className={tw("text-eyebrow font-semibold text-issa-accent")}>Akses</p>
              <h2 id="cms-login-title" className={tw("mt-1 text-[1.65rem] font-semibold tracking-[-0.035em] text-issa-text")}>Masuk ke workspace</h2>
              <p className={tw("mt-2 text-supporting leading-relaxed text-issa-muted")}>Gunakan NIP dan password staf yang terdaftar.</p>
            </div>
            <div className={tw("grid gap-4")}>
              <TextField id="teacher-nip" label="NIP" required autoComplete="username" type="text" name="NIP" value={loginCredentials.NIP} onChange={handleTeacherLoginInputChange} placeholder="Masukkan NIP" disabled={submitting || demoSubmitting} />
              <TextField id="teacher-password" label="Password" required autoComplete="current-password" type="password" name="password" value={loginCredentials.password} onChange={handleTeacherLoginInputChange} placeholder="Masukkan password" disabled={submitting || demoSubmitting} />
              {message ? <InlineNotice role="alert" tone="danger">{message}</InlineNotice> : null}
              <div className={tw("grid gap-2 pt-1 sm:grid-cols-2")}>
                <PrimaryButton className={tw("w-full")} tone="login" type="submit" disabled={submitting || demoSubmitting}>{submitting ? "Memeriksa akun..." : "Masuk"}</PrimaryButton>
                <SecondaryButton type="button" tone="loginSecondary" disabled={submitting || demoSubmitting} onClick={handleTeacherDemoLogin} className={tw("w-full")}>{demoSubmitting ? "Membuka demo…" : "Jelajahi Demo CMS"}</SecondaryButton>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
