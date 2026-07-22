import { getProgressOverview } from './academicProgress.js';

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

function localDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayAttendance(attendance, now = new Date()) {
  const today = localDateKey(now);

  return attendance
    .filter((record) => localDateKey(record.createdAt) === today)
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null;
}

export function getAttendanceCounts(attendance) {
  return attendance.reduce((counts, record) => {
    if (attendanceStatuses.includes(record.status)) {
      counts[record.status] += 1;
    }
    return counts;
  }, { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 });
}

export function getAttendanceHistory(attendance) {
  const records = attendance
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(left.createdAt).getTime();
      const rightDate = new Date(right.createdAt).getTime();
      const leftTimestamp = Number.isNaN(leftDate) ? Number.NEGATIVE_INFINITY : leftDate;
      const rightTimestamp = Number.isNaN(rightDate) ? Number.NEGATIVE_INFINITY : rightDate;

      if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp;
      return String(left.id ?? '').localeCompare(String(right.id ?? ''), 'id');
    });

  const groups = records.reduce((result, record) => {
    const date = new Date(record.createdAt);
    const validDate = !Number.isNaN(date.getTime());
    const key = validDate
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : 'unknown';

    if (!result[key]) {
      result[key] = {
        key,
        label: validDate
          ? date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          : 'Tanggal tidak tersedia',
        records: [],
      };
    }

    result[key].records.push(record);
    return result;
  }, {});

  return Object.values(groups);
}

export function getAcademicSummary(scores) {
  const progress = getProgressOverview(scores);

  return {
    lessonCount: progress.lessonCount,
    overallAverage: progress.overallAverage,
    lessons: progress.lessons,
    preview: progress.lessons.slice(0, 3),
  };
}

export function getNearestWeeklySchedule(schedule, now = new Date()) {
  if (!schedule.length) return null;

  const currentDay = now.getDay();
  const grouped = schedule.reduce((result, item) => {
    const normalizedDay = String(item.day || '').toLowerCase();
    const targetDay = Object.keys(scheduleDayLabels).indexOf(normalizedDay);

    if (targetDay === -1) return result;
    if (!result[normalizedDay]) result[normalizedDay] = [];
    result[normalizedDay].push(item.lesson);
    return result;
  }, {});

  const candidates = Object.entries(grouped)
    .map(([day, lessons]) => ({
      day,
      label: scheduleDayLabels[day] || day,
      lessons,
      distance: (Object.keys(scheduleDayLabels).indexOf(day) - currentDay + 7) % 7,
    }))
    .sort((left, right) => left.distance - right.distance || left.label.localeCompare(right.label, 'id'));

  return candidates[0] || null;
}

export function getLatestActivities(activity, limit = 3) {
  return activity
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}
