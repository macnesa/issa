import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import OfflineStatusIndicator from "../offline-workspace/OfflineStatusIndicator";
import TeacherCommandPalette from "../features/teacher-search/TeacherCommandPalette";
import "./teacher-layout.css";

export default function TeacherLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="teacher-workspace">
      <Sidebar />
      <div className="teacher-workspace__content">
        <header className="teacher-utility-bar">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="teacher-search-trigger"
            aria-label="Buka pencarian universal"
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <span
              className="material-symbols-outlined teacher-search-trigger__icon"
              aria-hidden="true"
            >
              search
            </span>
            <span className="teacher-search-trigger__label">Cari data ISSA</span>
            <kbd className="teacher-search-trigger__shortcut">
              ⌘K / Ctrl K
            </kbd>
          </button>
          <OfflineStatusIndicator />
        </header>
        <div className="teacher-workspace__main">
          <Outlet />
        </div>
      </div>
      <TeacherCommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
