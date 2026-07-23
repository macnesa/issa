import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";

export default function TeacherLayout() {
  return (
    <div className="min-h-screen bg-[var(--page)] md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
