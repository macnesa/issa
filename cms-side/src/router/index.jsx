import { createBrowserRouter, redirect } from "react-router-dom";
import TeacherLayout from "../layouts/TeacherLayout";
import Dashboard from "../pages/Dashboard";
import StudentsWorkspace from "../pages/StudentsWorkspace";
import Login from "../pages/Login";
import Schedule from "../pages/Schedule";
import ClassWorkspace from "../pages/ClassWorkspace";
import Attendance from "../pages/Attendance";
import ClassroomDebriefWorkspace from "../features/classroom-debrief/ClassroomDebriefWorkspace";
import {
  clearLastKnownTeacherIdentity,
  isTeacherDemoSession,
  isTeacherTokenExpired,
} from "../offline-workspace/authIdentity";

export const requireTeacherAuthentication = () => {
  void 'ISSA:CMS.AUTH.REQUIRE_TEACHER_SESSION';
  const token = localStorage.getItem("access_token");
  if (!token) return redirect("/login");
  if (isTeacherTokenExpired(token)) {
    const sessionReason = isTeacherDemoSession(token)
      ? "demo-expired"
      : "expired";
    localStorage.removeItem("access_token");
    clearLastKnownTeacherIdentity();
    return redirect(`/login?session=${sessionReason}`);
  }
  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <TeacherLayout />,
    loader: requireTeacherAuthentication,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/students", element: <StudentsWorkspace /> },
      { path: "/students/:studentId", element: <StudentsWorkspace /> },
      { path: "/scores/:studentId", element: <StudentsWorkspace initialWorkspace="assessment" /> },
      { path: "/class", element: <ClassWorkspace /> },
      { path: "/attendance", element: <Attendance /> },
      { path: "/classroom-debrief", element: <ClassroomDebriefWorkspace /> },
      { path: "/schedule", element: <Schedule /> },
      { path: "*", loader: () => redirect("/") },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "*", loader: () => redirect("/") },
]);

export default router;
