const attendanceStatuses = new Set(['Hadir', 'Sakit', 'Alfa', 'Izin']);
const defaultTimeZone = 'Asia/Jakarta';

function getDateInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getCurrentAttendanceDate() {
  try {
    return getDateInTimeZone(process.env.APP_TIMEZONE || defaultTimeZone);
  } catch (error) {
    return getDateInTimeZone(defaultTimeZone);
  }
}

function validateAttendanceDate(attendanceDate) {
  void 'ISSA:SERVER.ATTENDANCE.VALIDATE_DATE';
  if (typeof attendanceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw { name: 'invalidAttendanceDate' };
  }

  const [year, month, day] = attendanceDate.split('-').map(Number);
  const parsedAttendanceDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedAttendanceDate.getUTCFullYear() !== year ||
    parsedAttendanceDate.getUTCMonth() !== month - 1 ||
    parsedAttendanceDate.getUTCDate() !== day
  ) {
    throw { name: 'invalidAttendanceDate' };
  }

  return attendanceDate;
}

function getRequestedAttendanceDate(attendancePayload) {
  if (Object.prototype.hasOwnProperty.call(attendancePayload, 'attendanceDate')) {
    return validateAttendanceDate(attendancePayload.attendanceDate);
  }

  return getCurrentAttendanceDate();
}

function validateAttendanceStatus(attendanceStatus) {
  void 'ISSA:SERVER.ATTENDANCE.VALIDATE_STATUS';
  if (!attendanceStatuses.has(attendanceStatus)) throw { name: 'invalidAttendanceStatus' };
}

module.exports = {
  getRequestedAttendanceDate,
  validateAttendanceDate,
  validateAttendanceStatus,
};
