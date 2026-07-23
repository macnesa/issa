const isNil = require('lodash/isNil');
const studentRepository = require('./student.repository');
const { validateStudentCreatePayload } = require('./student.validator');

const studentPageSize = 7;

function getStudentListOffset(pageIndex) {
  if (pageIndex !== '' && typeof pageIndex !== 'undefined') {
    return pageIndex * studentPageSize - studentPageSize;
  }

  return undefined;
}

async function getStudentList({ classId, pageIndex, name }) {
  void 'ISSA:SERVER.STUDENT.GET_LIST';
  const studentList = await studentRepository.findStudentsForTeacher({
    classId,
    name,
    pageSize: studentPageSize,
    offset: getStudentListOffset(pageIndex),
  });

  return {
    ...studentList,
    page: pageIndex,
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
