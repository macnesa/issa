import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import OfflineStatusIndicator from "../offline-workspace/OfflineStatusIndicator";
import TeacherCommandPalette from "../features/teacher-search/TeacherCommandPalette";
import { SecondaryButton } from "../shared/ui/ui";
import "./teacher-layout.css";
import {
  clearLastKnownTeacherIdentity,
  getTeacherTokenExpiry,
  isTeacherDemoSession,
} from "../offline-workspace/authIdentity";

export default function TeacherLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const expiry = getTeacherTokenExpiry(token);
    if (!expiry) return undefined;

    const expireSession = () => {
      const sessionReason = isTeacherDemoSession(token)
        ? "demo-expired"
        : "expired";
      localStorage.removeItem("access_token");
      clearLastKnownTeacherIdentity();
      window.dispatchEvent(new Event("issa:teacher-identity-changed"));
      navigate(`/login?session=${sessionReason}`, { replace: true });
    };
    const remainingTime = expiry - Date.now();
    if (remainingTime <= 0) {
      expireSession();
      return undefined;
    }
    const timerId = window.setTimeout(expireSession, remainingTime);
    return () => window.clearTimeout(timerId);
  }, [navigate]);

  return (
    <div className="teacher-workspace">
      <Sidebar status={<OfflineStatusIndicator />} />
      <div className="teacher-workspace__content">
        <header className="teacher-utility-bar">
          <SecondaryButton
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
          </SecondaryButton>
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
