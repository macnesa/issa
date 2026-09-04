export default function StudentIdentity({ profile, compact = false }) {
  const studentName = profile.name || 'Siswa';
  const studentInitial = studentName.slice(0, 1).toUpperCase();

  return (
    <section className={`student-context${compact ? ' student-context--compact' : ''}`} aria-label={`Siswa ${studentName}`}>
      <div className="student-context__main">
        <div>
          <p className="section-kicker student-context__kicker">ISSA Parent</p>
          <p className="student-context__name">{studentName}</p>
          {!compact && (
            <p className="student-context__nim">
              <strong>NIM</strong>
              <span>{profile.nim || 'Belum tersedia'}</span>
            </p>
          )}
        </div>
        <div className="student-context__avatar">
          {profile.imageUrl ? (
            <img src={profile.imageUrl} alt={studentName} />
          ) : (
            <span>{studentInitial}</span>
          )}
        </div>
      </div>

      <dl className="student-context__meta">
        <div>
          <dt>Kelas</dt>
          <dd>{profile.className || 'Belum tersedia'}</dd>
        </div>
        <div>
          <dt>Wali kelas</dt>
          <dd>{profile.teacherName || 'Belum tersedia'}</dd>
        </div>
      </dl>
    </section>
  );
}
