
import { Outlet } from "react-router"
import Header from "../navigation/Header"
import BottomNav from "../navigation/BottomNav" 
import { fetchStudentOverview } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useCallback, useEffect, useRef, useState } from "react"
import { hasParentSession } from '../utils/session'
import { ErrorState, EmptyState, LoadingState } from '../shared/ui/ResourceStates'
import { connectParentSocket } from '../realtime/parentSocket'
import './ParentLayout.css'

export default function ParentLayout() { 
  const dispatch = useDispatch()
  const [studentInsightsRefreshKey, setStudentInsightsRefreshKey] = useState(0)
  const [showRealtimeNotice, setShowRealtimeNotice] = useState(false)
  const refetchTimer = useRef(null)
  const noticeTimer = useRef(null)
  
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

  const handleStudentRecordUpdated = useCallback(() => {
    window.clearTimeout(refetchTimer.current);
    refetchTimer.current = window.setTimeout(async () => {
      const overviewRefreshed = await dispatch(fetchStudentOverview());
      if (!overviewRefreshed) return;

      setStudentInsightsRefreshKey((refreshKey) => refreshKey + 1);
      setShowRealtimeNotice(true);
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => {
        setShowRealtimeNotice(false);
      }, 4000);
    }, 150);
  }, [dispatch]);

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
  }, []);

  const content = loading && !studentDetail.profile.id
    ? <LoadingState label="Loading student profile..." />
    : error
      ? <ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} />
      : loaded && studentDetail.profile.id === null
        ? <EmptyState message="Student profile is not available." />
        : <Outlet context={{ studentInsightsRefreshKey }} />;
  
  return (
    <div className="min-h-screen bg-[var(--issa-page)] pt-4">
      <Header />
      {showRealtimeNotice && (
        <div
          className="parent-realtime-notice"
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
