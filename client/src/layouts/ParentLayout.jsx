
import { Outlet } from "react-router"
import Header from "../navigation/Header"
import BottomNav from "../navigation/BottomNav" 
import { fetchStudentOverview } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useCallback, useEffect, useRef, useState } from "react"
import { hasParentSession } from '../utils/session'
import { ErrorState, EmptyState, LoadingState } from '../shared/ui/ResourceStates'
import {
  connectParentSocket,
  isEvidenceRecordEventForActiveStudent,
  isJournalRecordEventForActiveStudent,
  isStudentRecordEventForActiveStudent,
} from '../realtime/parentSocket'

const realtimeNoticeStyles = `
  @media (prefers-reduced-motion: no-preference) {
    .parent-realtime-notice {
      animation: parent-realtime-notice-in 180ms ease-out;
    }

    @keyframes parent-realtime-notice-in {
      from {
        opacity: 0;
        transform: translate(-50%, -0.35rem);
      }
    }
  }
`

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
    <div className="min-h-screen bg-[var(--issa-page)] pt-4">
      <style>{realtimeNoticeStyles}</style>
      <Header />
      {showRealtimeNotice && (
        <div
          className="parent-realtime-notice pointer-events-none fixed left-1/2 top-4 z-[60] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border border-[rgba(28,77,99,0.18)] bg-[#f6fbfc] px-4 py-[0.7rem] text-[0.86rem] font-bold leading-[1.3] text-[#1c4d63] shadow-[0_0.5rem_1.5rem_rgba(14,42,58,0.14)]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Catatan siswa diperbarui
        </div>
      )}
      {content}
      <BottomNav/>
    </div>
  )
}
