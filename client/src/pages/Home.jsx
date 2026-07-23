import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassSchedule, fetchSchoolActivities } from '../store/actions/actionCreator';
import AcademicSummary from '../features/student-overview/components/AcademicSummary';
import ActivityPreview from '../features/student-overview/components/ActivityPreview';
import AttendanceSummary from '../features/student-overview/components/AttendanceSummary';
import SchedulePreview from '../features/student-overview/components/SchedulePreview';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import TeacherFeedback from '../features/student-overview/components/TeacherFeedback';
import TodayAttendance from '../features/student-overview/components/TodayAttendance';
import { buildAcademicSummary, calculateAttendanceSummary, getLatestSchoolActivities, getTodayAttendance, getUpcomingWeeklySchedule } from '../features/student-overview/helpers';

export default function Home() {
  const dispatch = useDispatch();
  const { studentDetail, classSchedule, activity } = useSelector((state) => state.student);
  const { data: studentOverview } = studentDetail;

  useEffect(() => {
    if (!classSchedule.loaded && !classSchedule.loading) {
      dispatch(fetchClassSchedule());
    }
  }, [classSchedule.loaded, classSchedule.loading, dispatch]);

  useEffect(() => {
    if (!activity.loaded && !activity.loading) {
      dispatch(fetchSchoolActivities());
    }
  }, [activity.loaded, activity.loading, dispatch]);

  const todayAttendance = useMemo(() => getTodayAttendance(studentOverview.attendance), [studentOverview.attendance]);
  const attendanceSummary = useMemo(() => calculateAttendanceSummary(studentOverview.attendance), [studentOverview.attendance]);
  const academicSummary = useMemo(() => buildAcademicSummary(studentOverview.scores), [studentOverview.scores]);
  const upcomingSchedule = useMemo(() => getUpcomingWeeklySchedule(classSchedule.data), [classSchedule.data]);
  const latestActivities = useMemo(() => getLatestSchoolActivities(activity.data), [activity.data]);

  return (
    <main className="page-container overview-page">
      <StudentIdentity profile={studentOverview.profile} />
      <TodayAttendance attendance={todayAttendance} />
      <AttendanceSummary counts={attendanceSummary} />
      <AcademicSummary summary={academicSummary} />
      <TeacherFeedback profile={studentOverview.profile} />
      <SchedulePreview
        resource={classSchedule}
        schedule={upcomingSchedule}
        onRetry={() => dispatch(fetchClassSchedule())}
      />
      <ActivityPreview
        resource={activity}
        activities={latestActivities}
        onRetry={() => dispatch(fetchSchoolActivities())}
      />
    </main>
  );
}
