import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import { fetchClassSchedule, fetchSchoolActivities } from '../store/actions/actionCreator';
import AcademicSummary from '../features/student-overview/components/AcademicSummary';
import RecentStudentChanges from '../features/student-insights/components/RecentStudentChanges';
import StudentEvidenceSection from '../features/student-evidence/components/StudentEvidenceSection';
import StudentLearningJournalSection from '../features/student-learning-journal/components/StudentLearningJournalSection';
import ActivityPreview from '../features/student-overview/components/ActivityPreview';
import AttendanceSummary from '../features/student-overview/components/AttendanceSummary';
import SchedulePreview from '../features/student-overview/components/SchedulePreview';
import StudentIdentity from '../features/student-overview/components/StudentIdentity';
import TeacherFeedback from '../features/student-overview/components/TeacherFeedback';
import TodayAttendance from '../features/student-overview/components/TodayAttendance';
import { buildAcademicSummary, calculateAttendanceSummary, getLatestSchoolActivities, getTodayAttendance, getUpcomingWeeklySchedule } from '../features/student-overview/helpers';
import '../features/student-overview/student-overview.css';

export default function Home() {
  const dispatch = useDispatch();
  const {
    studentEvidenceRefreshKey = 0,
    studentInsightsRefreshKey = 0,
    studentJournalRefreshKey = 0,
  } = useOutletContext() || {};
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
    <main className="page-container overview-page relative isolate grid items-start gap-5 min-[900px]:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] min-[900px]:gap-x-6 min-[900px]:gap-y-[1.4rem]">
      <StudentIdentity profile={studentOverview.profile} />
      <TodayAttendance attendance={todayAttendance} />
      <AttendanceSummary counts={attendanceSummary} />
      <AcademicSummary summary={academicSummary} />
      <RecentStudentChanges
        studentId={studentOverview.profile.id}
        refreshKey={studentInsightsRefreshKey}
      />
      <StudentLearningJournalSection
        studentId={studentOverview.profile.id}
        refreshKey={studentJournalRefreshKey}
      />
      <StudentEvidenceSection
        studentId={studentOverview.profile.id}
        refreshKey={studentEvidenceRefreshKey}
      />
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
