import { SectionHeader, Surface } from '../../../shared/ui/ui';

export default function TeacherFeedback({ profile }) {
  return (
    <Surface className="teacher-feedback">
      <SectionHeader kicker="Catatan manusia" title="Feedback Wali Kelas" />
      {profile.teacherName && <strong className="teacher-feedback__author">{profile.teacherName}</strong>}
      <blockquote>
        {profile.feedback || 'Belum ada feedback dari wali kelas.'}
      </blockquote>
    </Surface>
  );
}
