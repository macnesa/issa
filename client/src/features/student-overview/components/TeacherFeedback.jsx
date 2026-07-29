export default function TeacherFeedback({ profile }) {
  return (
    <section className="grid grid-cols-[auto_minmax(0,1fr)] gap-[0.7rem] rounded-[2.45rem_0.85rem_0.85rem] border border-[#f0d7bf] bg-[#fff9f1] p-[1.4rem] max-[399px]:p-[1.15rem] min-[900px]:grid-cols-[4.9rem_minmax(0,1fr)] min-[900px]:gap-[0.95rem] min-[900px]:p-6">
      <div className="font-serif text-[4rem] font-bold leading-[0.7] text-[#d28a54] min-[900px]:relative min-[900px]:self-start min-[900px]:pt-1 min-[900px]:text-[4.7rem]" aria-hidden="true">“</div>
      <div>
      <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[var(--issa-text-muted)]">Catatan manusia</p>
      <h2 className="mt-1 text-[1.22rem] font-extrabold tracking-[-0.025em] text-[var(--issa-text)] min-[900px]:text-[1.3rem]">Feedback Wali Kelas</h2>
      {profile.teacherName && <p className="mt-2 text-[0.83rem] font-bold text-[#ab6e42] min-[900px]:mt-[0.4rem]">{profile.teacherName}</p>}
      <p className="mt-[0.9rem] text-[0.94rem] leading-[1.7] text-[#5d4737] min-[900px]:mt-[0.78rem]">
        {profile.feedback || 'Belum ada feedback dari wali kelas.'}
      </p>
      </div>
    </section>
  );
}
