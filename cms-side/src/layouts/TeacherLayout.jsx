import { tw } from "../shared/ui/tw";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import OfflineStatusIndicator from "../offline-workspace/OfflineStatusIndicator";
import TeacherCommandPalette from "../features/teacher-search/TeacherCommandPalette";
import Icon from "../shared/ui/Icon";
import {
  clearLastKnownTeacherIdentity,
  getTeacherTokenExpiry,
  isTeacherDemoSession,
} from "../offline-workspace/authIdentity";

export default function TeacherLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

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
    <div className={tw("teacher-workspace [--teacher-sidebar-width:16rem] [--teacher-utility-height:4rem] min-w-0 [min-height:100vh] [min-height:100dvh] bg-issa-page lg:grid lg:[grid-template-columns:var(--teacher-sidebar-width)_minmax(0,_1fr)] lg:[align-items:start] max-lg:[min-height:100svh]")}>
      <a className={tw("teacher-skip-link fixed left-2 top-2 z-[calc(var(--issa-z-popover)_+_1)] -translate-y-[calc(100%_+_var(--issa-space-4))] rounded-control border-emphasis border-issa-focus bg-issa-text px-3 py-2 text-button font-bold text-issa-inverse transition-transform duration-fast focus:translate-y-0 focus:outline-none motion-reduce:transition-none")} href="#cms-main-content">
        Lewati ke konten utama
      </a>
      <Sidebar status={<OfflineStatusIndicator />} />
      <div className={tw("teacher-workspace__content min-w-0 w-full lg:[grid-column:2]")}>
        <header className={tw("teacher-utility-bar sticky [z-index:18] top-0 min-w-0 [min-height:var(--teacher-utility-height)] [border-bottom:var(--issa-border-width)_solid_var(--issa-border-strong)] bg-issa-surface max-lg:[min-height:3.5rem]")}>
          <div className={tw("teacher-utility-bar__inner flex min-w-0 w-full max-w-content mx-auto items-center gap-4 py-2 px-4 sm:pr-6 sm:pl-6 lg:pr-8 lg:pl-8 max-lg:gap-2")}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={tw("teacher-search-trigger flex min-h-control min-w-0 w-full items-center justify-start gap-2 rounded-control border border-issa-border-strong bg-issa-surface px-4 py-2 text-left text-button font-bold leading-tight text-issa-text transition-[background-color,border-color,color,box-shadow] duration-default hover:border-issa-accent hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus motion-reduce:transition-none lg:[width:min(100%,_28rem)] max-lg:[flex:1_1_auto]")}
              aria-label="Buka pencarian universal"
              aria-haspopup="dialog"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <Icon
                name="search"
                className={tw("teacher-search-trigger__icon flex-none text-issa-accent text-section-title")}
              />
              <span className={tw("teacher-search-trigger__label min-w-0 overflow-hidden text-ellipsis whitespace-nowrap")}>Cari data ISSA</span>
              <kbd className={tw("teacher-search-trigger__shortcut flex-none whitespace-nowrap [border-left:var(--issa-border-width)_solid_var(--issa-border-strong)] pl-2 font-sans text-metadata font-bold leading-none text-issa-muted max-lg:hidden")}>
                ⌘K / Ctrl K
              </kbd>
            </button>
          </div>
        </header>
        <div className={tw("teacher-workspace__main min-w-0 w-full")}>
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
