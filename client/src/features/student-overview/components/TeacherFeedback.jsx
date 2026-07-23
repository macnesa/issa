export default function TeacherFeedback({ profile }) {
  return (
    <section className="overview-feedback grid grid-cols-[auto_minmax(0,1fr)] gap-[0.7rem] p-[1.4rem]">
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
