import { buildProgressOverview } from '../progress/helpers.js';
import groupBy from 'lodash/groupBy';
import isEmpty from 'lodash/isEmpty';
import orderBy from 'lodash/orderBy';

const attendanceStatuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

const scheduleDayLabels = {
  sunday: 'Minggu',
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
};

function getLocalDateKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayAttendance(attendanceRecords, currentDate = new Date()) {
  const today = getLocalDateKey(currentDate);

  return attendanceRecords
    .filter((attendanceRecord) => getLocalDateKey(attendanceRecord.createdAt) === today)
    .slice()
    .sort((newerAttendanceRecord, olderAttendanceRecord) => new Date(olderAttendanceRecord.createdAt) - new Date(newerAttendanceRecord.createdAt))[0] || null;
}

export function calculateAttendanceSummary(attendanceRecords) {
  void 'ISSA:CLIENT.ATTENDANCE.CALCULATE_SUMMARY';
  return attendanceRecords.reduce((attendanceSummary, attendanceRecord) => {
    if (attendanceStatuses.includes(attendanceRecord.status)) {
      attendanceSummary[attendanceRecord.status] += 1;
    }
    return attendanceSummary;
  }, { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 });
}

export function groupAttendanceHistoryByMonth(attendanceRecords) {
  void 'ISSA:CLIENT.ATTENDANCE.GROUP_HISTORY_BY_MONTH';
  const sortedAttendanceRecords = orderBy(attendanceRecords, [
    (attendanceRecord) => {
      const timestamp = new Date(attendanceRecord.createdAt).getTime();
      return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
    },
    (attendanceRecord) => String(attendanceRecord.id ?? ''),
  ], ['desc', 'asc']);

  const attendanceRecordsByMonth = groupBy(sortedAttendanceRecords, (attendanceRecord) => {
    const date = new Date(attendanceRecord.createdAt);
    const validDate = !Number.isNaN(date.getTime());
    return validDate
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : 'unknown';
  });

  return Object.entries(attendanceRecordsByMonth).map(([monthKey, attendanceRecordsForMonth]) => {
    const date = new Date(attendanceRecordsForMonth[0].createdAt);
    const validDate = !Number.isNaN(date.getTime());

    return {
      key: monthKey,
      label: validDate
        ? date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : 'Tanggal tidak tersedia',
      records: attendanceRecordsForMonth,
    };
  });
}

export function buildAcademicSummary(scoreRecords) {
  void 'ISSA:CLIENT.STUDENT.BUILD_ACADEMIC_SUMMARY';
  const progressOverview = buildProgressOverview(scoreRecords);

  return {
    lessonCount: progressOverview.lessonCount,
    overallAverage: progressOverview.overallAverage,
    lessons: progressOverview.lessons,
    preview: progressOverview.lessons.slice(0, 3),
  };
}

export function getUpcomingWeeklySchedule(scheduleEntries, currentDate = new Date()) {
  if (isEmpty(scheduleEntries)) return null;

  const currentDay = currentDate.getDay();
  const scheduleEntriesByDay = groupBy(scheduleEntries.filter((scheduleEntry) => {
    const normalizedDay = String(scheduleEntry.day || '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(scheduleDayLabels, normalizedDay);
  }), (scheduleEntry) => String(scheduleEntry.day || '').toLowerCase());

  const upcomingScheduleCandidates = Object.entries(scheduleEntriesByDay)
    .map(([day, entriesForDay]) => ({
      day,
      label: scheduleDayLabels[day] || day,
      lessons: entriesForDay.map((scheduleEntry) => scheduleEntry.lesson),
      distance: (Object.keys(scheduleDayLabels).indexOf(day) - currentDay + 7) % 7,
    }))
    .sort((left, right) => left.distance - right.distance || left.label.localeCompare(right.label, 'id'));

  return upcomingScheduleCandidates[0] || null;
}

export function getLatestSchoolActivities(activities, activityLimit = 3) {
  return orderBy(activities, [(activity) => new Date(activity.createdAt).getTime()], ['desc']).slice(0, activityLimit);
}
