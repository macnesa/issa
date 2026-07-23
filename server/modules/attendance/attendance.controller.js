const attendanceService = require('./attendance.service');

async function getAttendanceRecords(req, res, next) {
  try {
    const attendanceRecords = await attendanceService.getAttendanceRecords({
      studentId: req.query.StudentId,
      classId: req.user.classId,
    });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    next(error);
  }
}

async function createAttendanceRecord(req, res, next) {
  try {
    const attendanceRecord = await attendanceService.createAttendanceRecord({
      classId: req.user.classId,
      attendancePayload: { ...req.body },
    });

    res.status(201).json(attendanceRecord);
  } catch (error) {
    next(error);
  }
}

async function updateAttendanceRecord(req, res, next) {
  try {
    const attendanceRecord = await attendanceService.updateAttendanceRecord({
      classId: req.user.classId,
      attendancePayload: { ...req.body },
    });

    res.status(200).json(attendanceRecord);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
};
