const authenticationService = require('../authentication/authentication.service');
const teacherService = require('./teacher.service');

async function authenticateTeacher(req, res, next) {
  try {
    const authenticationResponse = await authenticationService.authenticateTeacher({
      NIP: req.body.NIP,
      password: req.body.password,
    });

    res.status(200).json(authenticationResponse);
  } catch (error) {
    next(error);
  }
}

async function getTeacherList(req, res, next) {
  try {
    const teachers = await teacherService.getTeacherList();
    res.status(200).json(teachers);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateTeacher,
  getTeacherList,
};
