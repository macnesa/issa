
import { Outlet } from "react-router"
import Header from "../navigation/Header"
import BottomNav from "../navigation/BottomNav" 
import { fetchStudentOverview } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useCallback, useEffect, useRef, useState } from "react"
import { hasParentSession } from '../utils/session'
import { ErrorState, EmptyState, LoadingState } from '../shared/ui/ResourceStates'
import { Notice } from '../shared/ui/ui'
import {
  connectParentSocket,
  isEvidenceRecordEventForActiveStudent,
  isJournalRecordEventForActiveStudent,
  isStudentRecordEventForActiveStudent,
} from '../realtime/parentSocket'


export default function ParentLayout() { 
  const dispatch = useDispatch()
  const [studentInsightsRefreshKey, setStudentInsightsRefreshKey] = useState(0)
  const [studentEvidenceRefreshKey, setStudentEvidenceRefreshKey] = useState(0)
  const [studentJournalRefreshKey, setStudentJournalRefreshKey] = useState(0)
  const [showRealtimeNotice, setShowRealtimeNotice] = useState(false)
  const refetchTimer = useRef(null)
  const noticeTimer = useRef(null)
  const pendingRecordTypes = useRef(new Set())
  
  const {
    student: { studentDetail: studentDetailResource },
  } = useSelector((state) => state);
  
  
  useEffect(() => {  
    if (hasParentSession() && !studentDetailResource.loaded && !studentDetailResource.loading) {
      dispatch(fetchStudentOverview())
    } 
  }, [dispatch, studentDetailResource.loaded, studentDetailResource.loading]);

  const { data: studentDetail, loading, loaded, error } = studentDetailResource;
  const studentId = studentDetail.profile.id;

  const handleStudentRecordUpdated = useCallback((studentRecordEvent) => {
    if (!isStudentRecordEventForActiveStudent(studentRecordEvent, studentId)) return;

    if (isEvidenceRecordEventForActiveStudent(studentRecordEvent, studentId)) {
      pendingRecordTypes.current.add('evidence');
      pendingRecordTypes.current.add('journal');
    }
    if (isJournalRecordEventForActiveStudent(studentRecordEvent, studentId)) {
      pendingRecordTypes.current.add('journal');
    }
    window.clearTimeout(refetchTimer.current);
    refetchTimer.current = window.setTimeout(async () => {
      const recordTypes = new Set(pendingRecordTypes.current);
      pendingRecordTypes.current.clear();

      if (recordTypes.has('evidence')) {
        setStudentEvidenceRefreshKey((refreshKey) => refreshKey + 1);
      }
      if (recordTypes.has('journal')) {
        setStudentJournalRefreshKey((refreshKey) => refreshKey + 1);
      }

      const overviewRefreshed = await dispatch(fetchStudentOverview());
      if (!overviewRefreshed) return;

      setStudentInsightsRefreshKey((refreshKey) => refreshKey + 1);
      setShowRealtimeNotice(true);
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => {
        setShowRealtimeNotice(false);
      }, 4000);
    }, 150);
  }, [dispatch, studentId]);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!hasParentSession() || !accessToken || !studentId) return undefined;

    return connectParentSocket({
      accessToken,
      studentId,
      onStudentRecordUpdated: handleStudentRecordUpdated,
    });
  }, [handleStudentRecordUpdated, studentId]);

  useEffect(() => () => {
    window.clearTimeout(refetchTimer.current);
    window.clearTimeout(noticeTimer.current);
    pendingRecordTypes.current.clear();
  }, []);

  const content = loading && !studentDetail.profile.id
    ? <LoadingState label="Loading student profile..." />
    : error
      ? <ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} />
      : loaded && studentDetail.profile.id === null
        ? <EmptyState message="Student profile is not available." />
        : <Outlet context={{
          studentEvidenceRefreshKey,
          studentInsightsRefreshKey,
          studentJournalRefreshKey,
        }} />;
  
  return (
    <div className="parent-app">
      <Header />
      {showRealtimeNotice && (
        <Notice
          floating
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Catatan siswa diperbarui
        </Notice>
      )}
      {content}
      <BottomNav />
    </div>
  )
}
