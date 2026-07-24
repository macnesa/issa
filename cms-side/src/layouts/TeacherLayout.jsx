import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import "./teacher-layout.css";

export default function TeacherLayout() {
  return (
    <div className="teacher-workspace min-h-screen md:flex">
      <Sidebar />
      <div className="teacher-workspace__content min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
