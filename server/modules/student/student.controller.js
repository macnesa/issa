const studentService = require('./student.service');

async function getStudentList(req, res, next) {
  try {
    const studentList = await studentService.getStudentList({
      classId: req.user.classId,
      pageIndex: req.query.pageIndex,
      name: req.query.name,
    });

    res.status(200).json(studentList);
  } catch (error) {
    next(error);
  }
}

async function getStudentDetail(req, res, next) {
  try {
    const student = await studentService.getStudentDetail({
      studentId: req.params.id,
      classId: req.user.classId,
    });

    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const { data, history } = await studentService.createStudent({
      classId: req.user.classId,
      studentPayload: { ...req.body },
    });

    res.status(201).json({ data, history });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudent,
  getStudentDetail,
  getStudentList,
};
