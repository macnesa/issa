import { useState } from "react";
import CheckboxField from "../../../shared/ui/form-controls/CheckboxField";
import TextField from "../../../shared/ui/form-controls/TextField";
import "../../../shared/ui/form-controls/form-controls.css";

export default function LoginForm({
  error,
  isDemoSubmitting,
  isSubmitting,
  onChange,
  onDemoLogin,
  onSubmit,
}) {
  const [isParentConfirmed, setIsParentConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  function handleParentConfirmationChange(checked) {
    setIsParentConfirmed(checked);

    if (checked) {
      setConfirmationError("");
    }
  }

  function handleLoginFormSubmit(event) {
    if (!isParentConfirmed) {
      event.preventDefault();
      setConfirmationError("Konfirmasikan bahwa Anda adalah orang tua.");
      return;
    }

    onSubmit(event);
  }

  return (
    <main
      style={{ minHeight: "100vh" }}
      className="overflow-x-hidden bg-[#173e52] text-[#173e52]"
    >
      <section
        style={{ minHeight: "100vh" }}
        className="relative bg-[#173e52] text-[#fffaf2]"
      >
        <div
          style={{ minHeight: "100vh" }}
          className="
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
          "
        >
          {/* Product orientation */}
          <header className="flex items-center border-b border-[#527382] pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden="true"
                className="
                  h-10
                  w-10
                  shrink-0
                  border
                  border-[#fffaf2]
                  bg-[#245b70]
                  p-1
                  shadow-[0.18rem_0.18rem_0_#6bbfbc]
                "
              >
                <img
                  src="/issa-logo.png"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="m-0 text-[0.64rem] font-[900] uppercase tracking-[0.19em] text-[#9ed4d0]">
                  ISSA Parent
                </p>

                <p className="m-0 mt-0.5 truncate text-[0.76rem] font-semibold text-[#fffaf2]">
                  Rekam perkembangan siswa
                </p>
              </div>
            </div>
          </header>

          {/* Shared product and access composition */}
          <div
            className="
              grid
              self-center
              items-start
              gap-9
              py-8
              lg:grid-cols-[minmax(0,1fr)_minmax(27rem,31.5rem)]
              lg:gap-[clamp(3.5rem,6vw,6rem)]
              lg:py-4
            "
          >
            {/* Product context */}
            <div className="mx-auto w-full max-w-[35rem] lg:mx-0 lg:pt-5">
              <p className="m-0 text-[0.66rem] font-[900] uppercase tracking-[0.2em] text-[#9ed4d0]">
                Akses orang tua
              </p>

              <h1
                className="
                  m-0
                  mt-4
                  text-[clamp(2.75rem,4.8vw,4.55rem)]
                  font-[900]
                  leading-[0.95]
                  tracking-[-0.052em]
                  text-[#fffaf2]
                "
              >
                Ikuti perkembangan
                <span className="block text-[#fffaf2]">
                  anak dengan jelas.
                </span>
              </h1>

              <p
                className="
                  m-0
                  mt-5
                  max-w-[31rem]
                  text-[clamp(0.94rem,1.25vw,1.05rem)]
                  leading-[1.65]
                  text-[#d8e7e9]
                "
              >
                Kehadiran, perkembangan akademik, jurnal, bukti belajar, dan
                catatan guru tersedia dalam satu rekam sekolah.
              </p>
            </div>

            {/* Primary action */}
            <form
              onSubmit={handleLoginFormSubmit}
              aria-busy={isSubmitting}
              aria-labelledby="parent-login-title"
              className="
                relative
                mx-auto
                w-full
                max-w-[34rem]
                overflow-hidden
                border
                border-[#173e52]
                bg-[#fffaf2]
                text-[#173e52]
                shadow-[0.42rem_0.46rem_0_#aac2ca]
                [border-radius:1rem_0.28rem_2.1rem_0.28rem]
                [animation:login-form-in_460ms_70ms_both]
                motion-reduce:animate-none

                lg:mx-0
                lg:max-w-none

                max-[640px]:shadow-[0.3rem_0.34rem_0_#aac2ca]
                max-[640px]:[border-radius:0.85rem_0.22rem_1.7rem_0.22rem]
              "
            >
              <header className="border-b border-[#d3dfe2] px-6 pb-5 pt-6 sm:px-7">
                <h2
                  id="parent-login-title"
                  className="
                    m-0
                    text-[clamp(1.9rem,3.5vw,2.35rem)]
                    font-[900]
                    leading-none
                    tracking-[-0.04em]
                    text-[#173e52]
                  "
                >
                  Masuk
                </h2>

                <p className="m-0 mt-2 max-w-[27rem] text-[0.88rem] leading-[1.5] text-[#567180]">
                  Gunakan NIM siswa dan password yang telah terdaftar.
                </p>
              </header>

              <div className="grid gap-4 px-6 py-5 sm:px-7 sm:py-6">
                <div className="grid gap-[0.9rem]">
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
                </div>

                <CheckboxField
                  id="parent-role"
                  label="Saya adalah orang tua"
                  checked={isParentConfirmed}
                  onChange={handleParentConfirmationChange}
                  error={confirmationError}
                  disabled={isSubmitting}
                  required
                />

                {error ? (
                  <div aria-live="polite" aria-atomic="true">
                    <p
                      role="alert"
                      className="
                        m-0
                        border-l-4
                        border-[var(--issa-danger)]
                        bg-[var(--issa-danger-soft)]
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        leading-[1.45]
                        text-[var(--issa-danger)]
                      "
                    >
                      {error}
                    </p>
                  </div>
                ) : null}

                <button
                  disabled={isSubmitting || isDemoSubmitting}
                  type="submit"
                  className="
                    min-h-[3.25rem]
                    w-full
                    border
                    border-[#173e52]
                    bg-[#245b70]
                    px-5
                    py-3
                    text-center
                    text-[0.84rem]
                    font-[900]
                    uppercase
                    tracking-[0.1em]
                    text-white
                    shadow-[0.22rem_0.24rem_0_#a4bec7]
                    transition-[background-color,transform,box-shadow,opacity]
                    duration-150
                    [border-radius:0.6rem_0.2rem_0.6rem_0.2rem]

                    hover:bg-[#173e52]

                    active:translate-x-[0.08rem]
                    active:translate-y-[0.08rem]
                    active:shadow-[0.1rem_0.12rem_0_#a4bec7]

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    disabled:shadow-none
                  "
                >
                  {isSubmitting ? "Sedang masuk..." : "Masuk"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isDemoSubmitting}
                  onClick={onDemoLogin}
                  className="
                    min-h-[3.05rem]
                    w-full
                    border
                    border-[#245b70]
                    bg-transparent
                    px-5
                    py-3
                    text-center
                    text-[0.82rem]
                    font-[900]
                    uppercase
                    tracking-[0.08em]
                    text-[#245b70]
                    transition-[background-color,color,opacity]
                    duration-150
                    [border-radius:0.6rem_0.2rem_0.6rem_0.2rem]
                    hover:bg-[#e8f4f2]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isDemoSubmitting ? "Membuka demo…" : "Lihat Demo Parent"}
                </button>

                <p className="m-0 text-left text-[0.68rem] leading-[1.5] text-[var(--issa-text-muted)]">
                  Dengan melanjutkan, Anda menyetujui Ketentuan Platform dan
                  Kebijakan Privasi ISSA.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
