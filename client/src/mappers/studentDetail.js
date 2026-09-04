import isNil from 'lodash/isNil';
import isPlainObject from 'lodash/isPlainObject';

const createEmptyStudentOverview = () => ({
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

const toPlainObjectRecord = (unknownValue) => (isPlainObject(unknownValue) ? unknownValue : {});

export function mapStudentResponseToOverview(studentResponse) {
  void 'ISSA:CLIENT.STUDENT.MAP_RESPONSE_TO_OVERVIEW';
  const student = toPlainObjectRecord(studentResponse);
  const classroom = toPlainObjectRecord(student.Class);
  const teacher = toPlainObjectRecord(classroom.Teacher);
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
    attendance: attendance.map((attendanceResponse) => {
      const attendanceRecord = toPlainObjectRecord(attendanceResponse);

      return {
        id: attendanceRecord.id ?? null,
        status: attendanceRecord.status ?? '',
        // Keep the existing overview shape; consumers receive the school day,
        // not the time a delayed/offline record happened to be inserted.
        createdAt: attendanceRecord.attendanceDate ?? attendanceRecord.createdAt ?? null,
      };
    }),
    scores: scores.map((scoreResponse) => {
      const score = toPlainObjectRecord(scoreResponse);
      const lesson = toPlainObjectRecord(score.Lesson);
      const assignment = toPlainObjectRecord(score.Assignment);
      const scoreValue = score.value === null || score.value === undefined || score.value === ''
        ? NaN : Number(score.value);
      const rawKkm = lesson.KKM;
      const kkm = isNil(rawKkm) || rawKkm === ''
        ? null
        : Number(rawKkm);
      const rawStatus = String(score.status ?? '').toLowerCase();
      const passedFromStatus = rawStatus === 'lulus' || rawStatus === 'passed';
      const passedFromValue = Number.isFinite(scoreValue) && Number.isFinite(kkm) && scoreValue >= kkm;

      return {
        id: score.id ?? null,
        lessonId: score.LessonId ?? lesson.id ?? null,
        assignmentId: score.AssignmentId ?? assignment.id ?? null,
        value: Number.isFinite(scoreValue) ? scoreValue : null,
        category: score.category ?? '',
        passed: passedFromStatus || passedFromValue,
        recordedAt: score.recordedAt ?? score.createdAt ?? null,
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

export const emptyStudentOverview = createEmptyStudentOverview;
