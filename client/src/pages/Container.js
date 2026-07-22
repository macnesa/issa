
import { Outlet } from "react-router"
import Header from "../components/Header"
import BottomNav from "../components/BottomNav" 
import { fetchStudentDetail } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { hasParentSession } from '../utils/session'
import { ErrorState, EmptyState, LoadingState } from '../components/runtime/ResourceStates'

export default function Container() { 
  const dispatch = useDispatch()
  
  const {
    student: { studentDetail: studentDetailResource },
  } = useSelector((state) => state);
  
  
  useEffect(() => {  
    if (hasParentSession() && !studentDetailResource.loaded && !studentDetailResource.loading) {
      dispatch(fetchStudentDetail())
    } 
  }, [dispatch, studentDetailResource.loaded, studentDetailResource.loading]);

  const { data: studentDetail, loading, loaded, error } = studentDetailResource;
  const content = loading && !studentDetail.profile.id
    ? <LoadingState label="Loading student profile..." />
    : error
      ? <ErrorState error={error} onRetry={() => dispatch(fetchStudentDetail())} />
      : loaded && studentDetail.profile.id === null
        ? <EmptyState message="Student profile is not available." />
        : <Outlet />;
  
  return (
    <div className="app-shell">
      <Header />
      {content}
      <BottomNav/>
    </div>
  )
}
