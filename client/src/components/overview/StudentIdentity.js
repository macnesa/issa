export default function StudentIdentity({ profile }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center gap-4">
        {profile.imageUrl ? (
          <img className="h-16 w-16 rounded-full border border-[var(--issa-border)] object-cover sm:h-20 sm:w-20" src={profile.imageUrl} alt={profile.name || 'Siswa'} />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--issa-primary-soft)] text-lg font-semibold text-[var(--issa-primary)] sm:h-20 sm:w-20">
            {profile.name?.slice(0, 1) || '?'}
          </div>
        )}
        <div>
          <p className="section-kicker">Rekam siswa</p>
          <h1 className="page-title mt-0.5">{profile.name || 'Siswa'}</h1>
          <p className="mt-1 text-sm text-[var(--issa-text-muted)]">NIM: {profile.nim || '-'}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div><dt className="inline text-[var(--issa-text-muted)]">Kelas: </dt><dd className="inline text-[var(--issa-text-secondary)]">{profile.className || '-'}</dd></div>
            <div><dt className="inline text-[var(--issa-text-muted)]">Wali kelas: </dt><dd className="inline text-[var(--issa-text-secondary)]">{profile.teacherName || '-'}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
