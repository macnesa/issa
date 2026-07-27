import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import OfflineStatusIndicator from "../offline-workspace/OfflineStatusIndicator";
import TeacherCommandPalette from "../features/teacher-search/TeacherCommandPalette";
import "./teacher-layout.css";

export default function TeacherLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="teacher-workspace min-h-screen md:flex">
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      <div className="teacher-workspace__content min-w-0 flex-1">
        <OfflineStatusIndicator />
        <Outlet />
      </div>
      <TeacherCommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
