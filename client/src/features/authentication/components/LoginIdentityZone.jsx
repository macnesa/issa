export default function LoginIdentityZone() {
  return (
    <section
      className="issa-login__record relative min-w-0 overflow-hidden bg-[#1c4d63] p-[2.4rem] text-white md:p-[2.8rem] max-[767px]:min-h-0 max-[767px]:px-[1.18rem] max-[767px]:py-[0.56rem]"
      style={{ backgroundImage: 'linear-gradient(135deg, #0e2a3a, #265367)' }}
      aria-labelledby="login-record-title"
    >
      <div className="issa-login__seal relative z-10 ml-[0.7rem] h-[4.1rem] w-[4.4rem] max-[767px]:ml-[0.2rem] max-[767px]:h-[2.45rem] max-[767px]:w-[2.65rem]">
        <img
          src="https://live.staticflickr.com/65535/52735891608_e4bb396871_w.jpg"
          className="h-full w-full object-contain"
          alt="ISSA"
        />
      </div>
      <p className="issa-login__kicker relative z-10 ml-[0.7rem] mt-[1.4rem] text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-[#c7e1eb] max-[767px]:ml-[0.2rem] max-[767px]:mt-[0.36rem] max-[767px]:text-[0.53rem] max-[767px]:tracking-[0.13em]">ISSA Parent</p>
      <h2 id="login-record-title" className="relative z-10 ml-[0.7rem] mt-[0.45rem] max-w-[19rem] text-[clamp(1.75rem,3vw,2.55rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white max-[767px]:ml-[0.2rem] max-[767px]:mt-[0.16rem] max-[767px]:max-w-none max-[767px]:text-[clamp(1.9rem,8.2vw,2.1rem)] max-[767px]:leading-[0.96] max-[767px]:tracking-[-0.06em]">Akses rekam perkembangan siswa</h2>
      <p className="relative z-10 ml-[0.7rem] mt-4 max-w-[17rem] text-[0.94rem] leading-[1.55] text-white/75 max-[767px]:ml-[0.2rem] max-[767px]:mt-[0.28rem] max-[767px]:max-w-none max-[767px]:whitespace-nowrap max-[767px]:text-[clamp(0.58rem,2.4vw,0.62rem)] max-[767px]:leading-[1.22]">Masuk untuk melihat catatan yang dibagikan sekolah.</p>
    </section>
  );
}
