export default function TeacherFeedback({ profile }) {
  return (
    <section className="overview-feedback">
      <div className="overview-feedback__mark" aria-hidden="true">“</div>
      <div>
      <p className="overview-kicker">Catatan manusia</p>
      <h2>Feedback Wali Kelas</h2>
      {profile.teacherName && <p className="overview-feedback__teacher">{profile.teacherName}</p>}
      <p className="overview-feedback__content">
        {profile.feedback || 'Belum ada feedback dari wali kelas.'}
      </p>
      </div>
    </section>
  );
}
