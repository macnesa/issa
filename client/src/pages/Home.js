import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivity, fetchClassSchedule } from '../store/actions/actionCreator';
import AcademicSummary from '../components/overview/AcademicSummary';
import ActivityPreview from '../components/overview/ActivityPreview';
import AttendanceSummary from '../components/overview/AttendanceSummary';
import SchedulePreview from '../components/overview/SchedulePreview';
import StudentIdentity from '../components/overview/StudentIdentity';
import TeacherFeedback from '../components/overview/TeacherFeedback';
import TodayAttendance from '../components/overview/TodayAttendance';
import { getAcademicSummary, getAttendanceCounts, getLatestActivities, getNearestWeeklySchedule, getTodayAttendance } from '../utils/studentOverview';

export default function Home() {
  const dispatch = useDispatch();
  const { studentDetail, classSchedule, activity } = useSelector((state) => state.student);
  const { data: detail } = studentDetail;

  useEffect(() => {
    if (!classSchedule.loaded && !classSchedule.loading) {
      dispatch(fetchClassSchedule());
    }
  }, [classSchedule.loaded, classSchedule.loading, dispatch]);

  useEffect(() => {
    if (!activity.loaded && !activity.loading) {
      dispatch(fetchActivity());
    }
  }, [activity.loaded, activity.loading, dispatch]);

  const todayAttendance = useMemo(() => getTodayAttendance(detail.attendance), [detail.attendance]);
  const attendanceCounts = useMemo(() => getAttendanceCounts(detail.attendance), [detail.attendance]);
  const academicSummary = useMemo(() => getAcademicSummary(detail.scores), [detail.scores]);
  const nearestSchedule = useMemo(() => getNearestWeeklySchedule(classSchedule.data), [classSchedule.data]);
  const latestActivities = useMemo(() => getLatestActivities(activity.data), [activity.data]);

  return (
    <main className="page-container space-y-4">
      <StudentIdentity profile={detail.profile} />
      <TodayAttendance attendance={todayAttendance} />
      <AttendanceSummary counts={attendanceCounts} />
      <AcademicSummary summary={academicSummary} />
      <TeacherFeedback profile={detail.profile} />
      <SchedulePreview
        resource={classSchedule}
        schedule={nearestSchedule}
        onRetry={() => dispatch(fetchClassSchedule())}
      />
      <ActivityPreview
        resource={activity}
        activities={latestActivities}
        onRetry={() => dispatch(fetchActivity())}
      />
    </main>
  );
}
