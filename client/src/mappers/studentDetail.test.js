import { mapStudentResponseToOverview } from './studentDetail';
import { buildJourneyEvents, formatParentDate } from '../features/parent-journey/parentJourney';
import { getTodayAttendance } from '../features/student-overview/helpers';
import { recordsInLastDays } from '../pages/Attendance';

describe('Parent domain dates', () => {
  const map = (attendance = {}, score = {}) => mapStudentResponseToOverview({
    Attendances: [{ id: 1, status: 'Sakit', createdAt: '2026-07-30T08:00:00Z', ...attendance }],
    Scores: [{ id: 2, value: 90, createdAt: '2026-07-30T08:00:00Z', ...score }],
  });
  it('uses attendanceDate instead of insertion time', () => {
    expect(map({ attendanceDate: '2026-06-29' }).attendance[0].createdAt).toBe('2026-06-29');
  });
  it('uses recordedAt instead of insertion time', () => {
    expect(map({}, { recordedAt: '2026-07-13T09:00:00Z' }).scores[0].recordedAt).toBe('2026-07-13T09:00:00Z');
  });
  it('falls back explicitly for legacy records', () => {
    const data = map();
    expect(data.attendance[0].createdAt).toBe('2026-07-30T08:00:00Z');
    expect(data.scores[0].recordedAt).toBe('2026-07-30T08:00:00Z');
  });
  it('does not disguise a malformed domain date with creation time', () => {
    const data = map({ attendanceDate: 'unknown' }, { recordedAt: 'unknown' });
    expect(formatParentDate(data.attendance[0].createdAt)).toBe('Tanggal belum tersedia');
    expect(formatParentDate(data.scores[0].recordedAt)).toBe('Tanggal belum tersedia');
  });
  it('sorts timeline families by their domain dates', () => {
    const data = map({ attendanceDate: '2026-07-15' }, { recordedAt: '2026-07-13T09:00:00Z' });
    expect(buildJourneyEvents(data).map((event) => event.type)).toEqual(['attendance', 'assessment']);
  });
  it('uses school day for today and inclusive 30-day window', () => {
    const now = new Date(2026, 6, 30, 12);
    const records = ['2026-06-30', '2026-07-01', '2026-07-30', '2026-07-31'].map((attendanceDate) => map({ attendanceDate }).attendance[0]);
    expect(getTodayAttendance(records, now).createdAt).toBe('2026-07-30');
    expect(recordsInLastDays(records, 30, now).map((item) => item.createdAt)).toEqual(['2026-07-01', '2026-07-30']);
  });
  it('keeps missing values unknown rather than manufacturing a zero', () => {
    expect(map({}, { value: null }).scores[0].value).toBeNull();
  });
});
