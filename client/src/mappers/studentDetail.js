const createEmptyStudentDetail = () => ({
  profile: {
    id: null,
    name: '',
    nim: '',
    imageUrl: '',
    birthDate: null,
    feedback: '',
    className: '',
    teacherName: '',
  },
  attendance: [],
  scores: [],
});

const asRecord = (value) => (value && typeof value === 'object' ? value : {});

export function mapStudentDetail(payload) {
  const student = asRecord(payload);
  const classroom = asRecord(student.Class);
  const teacher = asRecord(classroom.Teacher);
  const attendance = Array.isArray(student.Attendances) ? student.Attendances : [];
  const scores = Array.isArray(student.Scores) ? student.Scores : [];

  return {
    profile: {
      id: student.id ?? null,
      name: student.name ?? '',
      nim: student.NIM ?? '',
      imageUrl: student.imgUrl ?? '',
      birthDate: student.birthDate ?? null,
      feedback: student.feedback ?? '',
      className: classroom.name ?? '',
      teacherName: teacher.name ?? '',
    },
    attendance: attendance.map((record) => {
      const item = asRecord(record);

      return {
        id: item.id ?? null,
        status: item.status ?? '',
        createdAt: item.createdAt ?? null,
      };
    }),
    scores: scores.map((record) => {
      const score = asRecord(record);
      const lesson = asRecord(score.Lesson);
      const assignment = asRecord(score.Assignment);
      const value = Number(score.value);
      const rawKkm = lesson.KKM;
      const kkm = rawKkm === null || rawKkm === undefined || rawKkm === ''
        ? null
        : Number(rawKkm);
      const rawStatus = String(score.status ?? '').toLowerCase();
      const passedFromStatus = rawStatus === 'lulus' || rawStatus === 'passed';
      const passedFromValue = Number.isFinite(value) && Number.isFinite(kkm) && value >= kkm;

      return {
        id: score.id ?? null,
        lessonId: score.LessonId ?? lesson.id ?? null,
        assignmentId: score.AssignmentId ?? assignment.id ?? null,
        value: Number.isFinite(value) ? value : null,
        category: score.category ?? '',
        passed: passedFromStatus || passedFromValue,
        recordedAt: score.createdAt ?? null,
        lesson: {
          id: lesson.id ?? null,
          name: lesson.name ?? '',
          kkm: Number.isFinite(kkm) ? kkm : null,
          imageUrl: lesson.imgUrl ?? '',
        },
        assignment: {
          description: assignment.desc ?? '',
        },
      };
    }),
  };
}

export const emptyStudentDetail = createEmptyStudentDetail;
