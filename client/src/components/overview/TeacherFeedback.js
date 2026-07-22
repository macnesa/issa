export default function TeacherFeedback({ profile }) {
  return (
    <section className="surface surface--soft p-5">
      <h2 className="section-heading">Feedback Wali Kelas</h2>
      {profile.teacherName && <p className="mt-1 text-sm text-[var(--issa-text-muted)]">{profile.teacherName}</p>}
      <p className="mt-3 text-sm leading-6 text-[var(--issa-text-secondary)]">
        {profile.feedback || 'Belum ada feedback dari wali kelas.'}
      </p>
    </section>
  );
}
