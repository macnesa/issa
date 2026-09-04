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
    <div className={tw("teacher-workspace [--teacher-sidebar-width:12.75rem] [--teacher-utility-height:3.25rem] min-w-0 [min-height:100vh] [min-height:100dvh] bg-issa-page lg:grid lg:[grid-template-columns:var(--teacher-sidebar-width)_minmax(0,_1fr)] lg:[align-items:start]")}>
      <a
        className={tw("teacher-skip-link fixed left-3 top-3 z-[calc(var(--issa-z-popover)_+_1)] -translate-y-[calc(100%_+_var(--issa-space-4))] rounded-control bg-issa-text px-3 py-2 text-button font-semibold text-issa-inverse shadow-dialog transition-transform duration-fast focus:translate-y-0 focus:outline-none motion-reduce:transition-none")}
        href="#cms-main-content"
      >
        Lewati ke konten utama
      </a>

      <Sidebar status={<OfflineStatusIndicator />} onSearch={() => setSearchOpen(true)} />

      <div className={tw("teacher-workspace__content min-w-0 w-full lg:[grid-column:2]")}>
        <header className={tw("teacher-utility-bar sticky top-0 z-[18] max-lg:hidden min-w-0 border-b border-issa-border bg-[color-mix(in_srgb,var(--issa-page)_94%,transparent)] backdrop-blur-lg")}>
          <div className={tw("teacher-utility-bar__inner flex min-h-[var(--teacher-utility-height)] w-full max-w-content min-w-0 mx-auto items-center gap-3 px-4 sm:px-6 lg:px-10")}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={tw("teacher-search-trigger flex min-h-control min-w-0 items-center justify-start gap-2.5 rounded-control border-0 bg-transparent px-1 py-2 text-left text-button font-semibold leading-tight text-issa-text transition-colors duration-default hover:bg-issa-subtle focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus motion-reduce:transition-none lg:[width:min(100%,_28rem)] max-lg:flex-1")}
              aria-label="Buka pencarian universal"
              aria-haspopup="dialog"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <Icon
                name="search"
                className={tw("teacher-search-trigger__icon flex-none text-lg text-issa-muted")}
              />
              <span className={tw("teacher-search-trigger__label min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-issa-muted")}>
                Cari siswa, record, atau halaman…
              </span>
              <kbd className={tw("teacher-search-trigger__shortcut flex-none rounded-md bg-issa-subtle px-2 py-1 font-sans text-metadata font-semibold leading-none text-issa-muted max-lg:hidden")}>
                ⌘K
              </kbd>
            </button>

          </div>
        </header>

        <div className={tw("teacher-workspace__main min-w-0 w-full max-lg:pb-[5.75rem]")}>
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
