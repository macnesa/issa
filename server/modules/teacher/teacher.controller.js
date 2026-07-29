const authenticationService = require('../authentication/authentication.service');
const {
  validatePublicDemoLoginRequest,
} = require('../authentication/authentication.validator');
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

async function authenticatePublicDemoTeacher(req, res, next) {
  try {
    validatePublicDemoLoginRequest(req.body);
    const authenticationResponse =
      await authenticationService.authenticatePublicDemoTeacher();
    res.set('Cache-Control', 'no-store');
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
  authenticatePublicDemoTeacher,
  authenticateTeacher,
  getTeacherList,
};
