const isNil = require('lodash/isNil');
const studentRepository = require('./student.repository');
const { validateStudentCreatePayload } = require('./student.validator');

const studentPageSize = 7;

function normalizeStudentListPage(pageIndex) {
  const normalizedPage = Number.parseInt(pageIndex, 10);
  return Number.isFinite(normalizedPage) && normalizedPage > 0
    ? normalizedPage
    : 1;
}

async function getStudentList({ classId, pageIndex, name }) {
  void 'ISSA:SERVER.STUDENT.GET_LIST';
  const page = normalizeStudentListPage(pageIndex);
  const studentList = await studentRepository.findStudentsForTeacher({
    classId,
    name,
    pageSize: studentPageSize,
    offset: (page - 1) * studentPageSize,
  });

  return {
    ...studentList,
    page,
    pageSize: studentPageSize,
    totalPages: Math.ceil(studentList.count / studentPageSize),
  };
}

async function getStudentDetail({ studentId, classId }) {
  void 'ISSA:SERVER.STUDENT.GET_DETAIL';
  const student = await studentRepository.findStudentByIdForTeacher(
    studentId,
    classId
  );
  if (isNil(student)) throw { name: 'notFound' };

  const taskScoreWeights = student.Scores
    .filter((scoreRecord) => scoreRecord.Assignment.type == 'Task')
    .map((scoreRecord) => scoreRecord.value * 0.45);
  console.log(taskScoreWeights);

  return student;
}

async function createStudent({ classId, studentPayload }) {
  const teacherClass = await studentRepository.findTeacherClass(classId);
  const validStudentPayload = validateStudentCreatePayload(studentPayload);
  const student = await studentRepository.createStudentRecord({
    ...validStudentPayload,
    ClassId: teacherClass.id,
  });
  const history = await studentRepository.createStudentHistory({
    description: `student with name ${student.name} has been created`,
    createdBy: teacherClass.Teacher.name,
  });

  return { data: student, history };
}

module.exports = {
  createStudent,
  getStudentDetail,
  getStudentList,
};
