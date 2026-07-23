
import { Outlet } from "react-router"
import Header from "../navigation/Header"
import BottomNav from "../navigation/BottomNav" 
import { fetchStudentOverview } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { hasParentSession } from '../utils/session'
import { ErrorState, EmptyState, LoadingState } from '../shared/ui/ResourceStates'

export default function ParentLayout() { 
  const dispatch = useDispatch()
  
  const {
    student: { studentDetail: studentDetailResource },
  } = useSelector((state) => state);
  
  
  useEffect(() => {  
    if (hasParentSession() && !studentDetailResource.loaded && !studentDetailResource.loading) {
      dispatch(fetchStudentOverview())
    } 
  }, [dispatch, studentDetailResource.loaded, studentDetailResource.loading]);

  const { data: studentDetail, loading, loaded, error } = studentDetailResource;
  const content = loading && !studentDetail.profile.id
    ? <LoadingState label="Loading student profile..." />
    : error
      ? <ErrorState error={error} onRetry={() => dispatch(fetchStudentOverview())} />
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
