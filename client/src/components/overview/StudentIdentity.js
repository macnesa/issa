export default function StudentIdentity({ profile }) {
  return (
    <section className="overview-identity">
      <div className="overview-identity__motif" aria-hidden="true" />
      <p className="overview-identity__record"><span>Record</span><strong>{profile.id ? `#${profile.id}` : 'ISSA'}</strong></p>
      <div className="overview-identity__content">
        <div className="overview-identity__portrait">
          {profile.imageUrl ? (
            <img src={profile.imageUrl} alt={profile.name || 'Siswa'} />
          ) : (
            <span>{profile.name?.slice(0, 1) || '?'}</span>
          )}
        </div>
        <div className="overview-identity__copy">
          <p className="overview-identity__eyebrow">Rekam perkembangan siswa</p>
          <h1>{profile.name || 'Siswa'}</h1>
          <p className="overview-identity__nim">NIM · {profile.nim || '-'}</p>
          <dl>
            <div><dt>Kelas</dt><dd>{profile.className || '-'}</dd></div>
            <div><dt>Wali kelas</dt><dd>{profile.teacherName || '-'}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
