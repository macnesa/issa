import { createBrowserRouter, redirect } from "react-router-dom";
import Layout from "../pages/Layout";
import Dashboard from "../pages/Dashboard";
import Scores from "../pages/Scores";
import StudentDetail from "../pages/AddStudent";
import Login from "../pages/Login";
import Schedule from "../pages/Schedule";
import Attendance from "../pages/Attendance";

const protectedRedirect = () => {
  if (!localStorage.getItem("access_token")) return redirect("/login");
  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    loader: protectedRedirect,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/students/:studentId", element: <StudentDetail /> },
      { path: "/scores/:studentId", element: <Scores /> },
      { path: "/attendance", element: <Attendance /> },
      { path: "/schedule", element: <Schedule /> },
      { path: "*", loader: () => redirect("/") },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "*", loader: () => redirect("/") },
]);

export default router;
