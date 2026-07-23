const publicStudentService = require('./public-student.service');

async function getClassmates(req, res, next) {
  try {
    const classmates = await publicStudentService.getClassmates({
      classId: req.user.classId,
    });

    res.status(200).json(classmates);
  } catch (error) {
    next(error);
  }
}

async function getPublicStudentDetail(req, res, next) {
  try {
    const student = await publicStudentService.getPublicStudentDetail({
      studentId: req.user.studentId,
    });

    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
}

async function getPublicClassSchedule(req, res, next) {
  try {
    const scheduleEntries = await publicStudentService.getPublicClassSchedule({
      classId: req.user.classId,
    });

    res.status(200).json(scheduleEntries);
  } catch (error) {
    next(error);
  }
}

async function getSchoolActivities(req, res, next) {
  try {
    const schoolActivities = await publicStudentService.getSchoolActivities();

    res.status(200).json(schoolActivities);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClassmates,
  getPublicClassSchedule,
  getPublicStudentDetail,
  getSchoolActivities,
};
