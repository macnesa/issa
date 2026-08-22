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
    <main
      style={{ minHeight: "100vh" }}
      className={tw("overflow-x-hidden bg-[#173e52] text-[#edf4f4]")}
    >
      <div
        style={{ minHeight: "100vh" }}
        className={tw(`
          mx-auto
          grid
          w-full
          max-w-[76rem]
          grid-rows-[auto_1fr]
          px-5
          py-5
          sm:px-8
          sm:py-6
          lg:px-12
          lg:py-7
        `)}
      >
        {/* Institutional identity */}
        <header className={tw("flex items-center justify-between gap-6 border-b border-[#527382] pb-4")}>
          <div className={tw("flex min-w-0 items-center gap-3")}>
            <div
              aria-hidden="true"
              className={tw(`
                h-10
                w-10
                shrink-0
                border
                border-[#d7e7e8]
                bg-[#245b70]
                p-1
                shadow-[0.16rem_0.16rem_0_#6bbfbc]
              `)}
            >
              <img
                src={issaLogo}
                alt=""
                className={tw("h-full w-full object-contain")}
              />
            </div>

            <div className={tw("min-w-0")}>
              <p className={tw("m-0 text-[0.63rem] font-extrabold uppercase tracking-[0.22em] text-[#9ed4d0]")}>
                ISSA CMS
              </p>

              <p className={tw("m-0 mt-0.5 truncate text-[0.76rem] font-bold tracking-[0.01em] text-[#f7faf8]")}>
                Sistem administrasi akademik
              </p>
            </div>
          </div>

          <div className={tw("shrink-0 border-l border-[#527382] pl-5 text-right max-[480px]:hidden")}>
            <p className={tw("m-0 text-[0.56rem] font-extrabold uppercase tracking-[0.2em] text-[#9ed4d0]")}>
              Akses
            </p>

            <p className={tw("m-0 mt-0.5 text-[0.76rem] font-extrabold text-[#f7faf8]")}>
              Internal
            </p>
          </div>
        </header>

        {/* Shared operational composition */}
        <section
          aria-labelledby="cms-context-title"
          className={tw(`
            grid
            content-center
            items-start
            gap-9
            py-8
            sm:py-10
            lg:grid-cols-[minmax(0,1fr)_minmax(28rem,31.5rem)]
            lg:gap-[clamp(3rem,5vw,5.5rem)]
            lg:py-8
          `)}
        >
          {/* Operational context */}
          <div className={tw("w-full max-w-[35rem] border-l-2 border-[#6bbfbc] py-1 pl-5 sm:pl-7")}>
            <p className={tw("m-0 text-[0.63rem] font-extrabold uppercase tracking-[0.21em] text-[#9ed4d0]")}>
              Administrasi akademik
            </p>

            <h1
              id="cms-context-title"
              className={tw(`
                m-0
                mt-4
                max-w-[32rem]
                text-[clamp(2.45rem,4.35vw,3.9rem)]
                font-extrabold
                leading-[0.96]
                tracking-[-0.05em]
                text-[#f7faf8]
              `)}
            >
              Kelola administrasi akademik sekolah.
            </h1>

            <p
              className={tw(`
                m-0
                mt-5
                max-w-[30rem]
                text-[clamp(0.9rem,1.15vw,0.98rem)]
                leading-[1.65]
                text-[#cbdcdf]
              `)}
            >
              Kelola catatan siswa, kehadiran, nilai, dan jadwal melalui akses
              internal.
            </p>
          </div>

          {/* Authorized staff access */}
          <form
            onSubmit={handleTeacherLoginSubmit}
            aria-busy={submitting || demoSubmitting}
            aria-labelledby="cms-login-title"
            className={tw(`
              mx-auto
              w-full
              max-w-[32rem]
              border-2
              border-[#0e2a3a]
              bg-[#f2f5f2]
              text-[#173e52]
              shadow-[0.24rem_0.26rem_0_#78949e]
              [border-radius:0.18rem_0_0.32rem_0]

              lg:mx-0
              lg:max-w-none
            `)}
          >
            <header className={tw("border-b-2 border-[#b9cdd0] px-6 pb-4 pt-5 sm:px-7 sm:pt-6")}>
              <h2
                id="cms-login-title"
                className={tw(`
                  m-0
                  text-[clamp(1.8rem,3vw,2.15rem)]
                  font-extrabold
                  leading-none
                  tracking-[-0.04em]
                  text-[#173e52]
                `)}
              >
                Masuk ke CMS
              </h2>

              <p className={tw("m-0 mt-2 text-[0.86rem] leading-[1.5] text-[#5d737b]")}>
                Gunakan NIP dan password staf yang terdaftar.
              </p>
            </header>

            <div className={tw("grid gap-4 px-6 pb-6 pt-5 sm:px-7")}>
              <TextField
                id="teacher-nip"
                label="NIP"
                required
                autoComplete="username"
                type="text"
                name="NIP"
                value={loginCredentials.NIP}
                onChange={handleTeacherLoginInputChange}
                placeholder="Masukkan NIP"
                disabled={submitting || demoSubmitting}
              />

              <TextField
                id="teacher-password"
                label="Password"
                required
                autoComplete="current-password"
                type="password"
                name="password"
                value={loginCredentials.password}
                onChange={handleTeacherLoginInputChange}
                placeholder="Masukkan password"
                disabled={submitting || demoSubmitting}
              />

              {message ? (
                <InlineNotice role="alert" tone="danger">
                  {message}
                </InlineNotice>
              ) : null}

              <PrimaryButton
                className={tw(`
                  mt-0.5
                  w-full
                `)}
                tone="login"
                type="submit"
                disabled={submitting || demoSubmitting}
              >
                {submitting ? "Memeriksa akun..." : "Masuk"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                tone="loginSecondary"
                disabled={submitting || demoSubmitting}
                onClick={handleTeacherDemoLogin}
                className={tw("w-full")}
              >
                {demoSubmitting ? "Membuka demo…" : "Jelajahi Demo CMS"}
              </SecondaryButton>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
