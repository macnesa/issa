export default function StudentIdentity({ profile }) {
  const studentName = profile.name || 'Siswa';
  const studentInitial = studentName.slice(0, 1).toUpperCase();

  return (
    <section
      className="student-identity overflow-hidden border border-[#173e52] text-white shadow-[0.42rem_0.48rem_0_rgba(23,62,82,0.14)]"
      style={{
        borderRadius: '0.85rem 1.2rem 2.45rem 0.85rem',
        backgroundColor: '#1c4d63',
        backgroundImage: `
          radial-gradient(
            circle at 78% 32%,
            rgba(199, 225, 235, 0.09) 0%,
            rgba(199, 225, 235, 0.035) 24%,
            rgba(199, 225, 235, 0) 48%
          ),
          linear-gradient(
            105deg,
            #21566d 0%,
            #1d5066 30%,
            #1a485e 58%,
            #143b4e 78%,
            #102f3f 100%
          )
        `,
      }}
    >
      <div className="grid min-h-[14.25rem] grid-cols-[minmax(0,1fr)_clamp(6.5rem,31vw,8rem)] items-center sm:min-h-[16rem] sm:grid-cols-[minmax(0,1fr)_10rem] lg:min-h-[17.5rem] lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-11">
          <p className="m-0 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-[#c7e1eb] sm:text-[0.67rem]">
            Rekam perkembangan siswa
          </p>

          <h1 className="mt-3.5 max-w-[43rem] break-words text-[clamp(2rem,7vw,4.3rem)] font-extrabold leading-[0.92] tracking-[-0.052em] text-white">
            {studentName}
          </h1>

          <p className="mb-0 mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[0.61rem] font-extrabold uppercase tracking-[0.13em] text-[#c7e1eb]">
              NIM
            </span>

            <span className="break-all text-[0.79rem] font-semibold text-white/72 sm:text-[0.87rem]">
              {profile.nim || 'Belum tersedia'}
            </span>
          </p>
        </div>

        <div className="flex h-full items-center justify-center py-7 pr-4 sm:py-8 sm:pr-6 lg:py-9 lg:pr-8">
          <div
            className="flex aspect-square w-full max-w-[6.15rem] items-center justify-center overflow-hidden border-[0.28rem] border-white/90 bg-[#c7e1eb] text-[2.25rem] font-extrabold text-[#173e52] sm:max-w-[8.5rem] sm:text-[3rem] lg:max-w-[10.5rem] lg:text-[3.5rem]"
            style={{
              borderRadius: '34% 66% 61% 39% / 36% 37% 63% 64%',
              boxShadow: '0.36rem 0.4rem 0 rgba(7, 28, 38, 0.34)',
              transform: 'rotate(-2deg)',
            }}
          >
            {profile.imageUrl ? (
              <img
                className="h-full w-full rotate-[2deg] scale-[1.06] object-cover object-center"
                src={profile.imageUrl}
                alt={studentName}
              />
            ) : (
              <span className="rotate-[2deg]">
                {studentInitial}
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-1 border-t border-[#173e52]/35 bg-[#f3eedf] text-[#173e52] sm:grid-cols-[0.8fr_1.2fr]">
        <div className="min-w-0 border-b border-[#173e52]/15 px-5 py-[1.15rem] sm:border-b-0 sm:border-r sm:px-8 sm:py-5 lg:px-10">
          <dt className="text-[0.61rem] font-extrabold uppercase tracking-[0.14em] text-[#527487]">
            Kelas
          </dt>

          <dd className="mb-0 mt-1.5 break-words text-[0.98rem] font-extrabold leading-tight sm:text-[1.06rem]">
            {profile.className || 'Belum tersedia'}
          </dd>
        </div>

        <div className="min-w-0 px-5 py-[1.15rem] sm:px-8 sm:py-5">
          <dt className="text-[0.61rem] font-extrabold uppercase tracking-[0.14em] text-[#527487]">
            Wali kelas
          </dt>

          <dd className="mb-0 mt-1.5 break-words text-[0.88rem] font-bold leading-snug sm:text-[0.96rem]">
            {profile.teacherName || 'Belum tersedia'}
          </dd>
        </div>
      </dl>
    </section>
  );
}