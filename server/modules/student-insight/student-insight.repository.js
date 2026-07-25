const {
  Attendance,
  Lesson,
  Score,
  Student,
  StudentFeedback,
} = require('../../models');

function findStudentForRequester({
  studentId,
  requesterRole,
  requesterClassId,
  requesterStudentId,
}) {
  const studentWhere = { id: studentId };

  if (requesterRole === 'teacher') {
    studentWhere.ClassId = requesterClassId;
  } else if (requesterRole === 'parent') {
    if (studentId !== requesterStudentId) return null;
  } else {
    return null;
  }

  return Student.findOne({
    where: studentWhere,
    attributes: ['id', 'name', 'NIM', 'imgUrl'],
  });
}

function findStudentsForTeacher(classId) {
  return Student.findAll({
    where: { ClassId: classId },
    attributes: ['id', 'name', 'NIM', 'imgUrl'],
  });
}

function findAttendanceRecords(studentIds) {
  return Attendance.findAll({
    where: { StudentId: studentIds },
    attributes: [
      'id',
      'StudentId',
      'status',
      'attendanceDate',
      'createdAt',
    ],
  });
}

function findScoreRecords(studentIds) {
  return Score.findAll({
    where: { StudentId: studentIds },
    attributes: [
      'id',
      'StudentId',
      'LessonId',
      'value',
      'recordedAt',
      'createdAt',
    ],
    include: {
      model: Lesson,
      attributes: ['id', 'name', 'KKM'],
      required: true,
    },
  });
}

function findFeedbackRecords(studentIds) {
  return StudentFeedback.findAll({
    where: { StudentId: studentIds },
    attributes: [
      'id',
      'StudentId',
      'content',
      'observedAt',
      'createdAt',
    ],
  });
}

module.exports = {
  findAttendanceRecords,
  findFeedbackRecords,
  findScoreRecords,
  findStudentForRequester,
  findStudentsForTeacher,
};
