import { tw } from "../shared/ui/tw";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react/components/Modal";
import {
  clearLastKnownTeacherIdentity,
  getActiveTeacherIdentity,
  isTeacherDemoSession,
} from "../offline-workspace/authIdentity";
import { clearTeacherOfflineData } from "../offline-workspace/mutationQueue";
import { hasUnsyncedAttendanceChanges } from "../offline-workspace/attendanceOffline";
import {
  DestructiveButton,
  InlineNotice,
  SecondaryButton,
} from "../shared/ui/ui";
import Icon from "../shared/ui/Icon";
import issaLogo from "../../assets/img/logo.png";
import { workflowOwners } from "./workflowRoutes";

const navigation = [
  {
    to: workflowOwners.today,
    label: "Hari ini",
    mobileLabel: "Hari ini",
    icon: "today",
    matches: (pathname) => pathname === "/",
  },
  {
    to: workflowOwners.students,
    label: "Siswa",
    mobileLabel: "Siswa",
    icon: "group",
    matches: (pathname) => pathname.startsWith("/students") || pathname.startsWith("/scores"),
  },
  {
    to: workflowOwners.class,
    label: "Kelas",
    mobileLabel: "Kelas",
    icon: "school",
    matches: (pathname) => pathname === "/class" || pathname === "/attendance" || pathname === "/schedule",
  },
];

export default function Sidebar({ status = null, onSearch = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [teacherIdentity, setTeacherIdentity] = useState(getActiveTeacherIdentity);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const teacherName = teacherIdentity?.name?.trim();
  const isDemo = isTeacherDemoSession();
  const currentDomain = useMemo(
    () => navigation.find((item) => item.matches(pathname))?.label
      || (pathname === "/classroom-debrief" ? "Catat kelas" : "Ruang kerja"),
    [pathname]
  );

  useEffect(() => {
    const refreshTeacherIdentity = () => setTeacherIdentity(getActiveTeacherIdentity());
    window.addEventListener("issa:teacher-identity-changed", refreshTeacherIdentity);
    return () => window.removeEventListener("issa:teacher-identity-changed", refreshTeacherIdentity);
  }, []);

  const completeTeacherLogout = async () => {
    const activeTeacher = getActiveTeacherIdentity();
    setLogoutPending(true);
    setLogoutError("");
    try {
      if (activeTeacher?.id && !isDemo) {
        await clearTeacherOfflineData(activeTeacher.id);
      }
      localStorage.removeItem("access_token");
      clearLastKnownTeacherIdentity();
      window.dispatchEvent(new Event("issa:teacher-identity-changed"));
      navigate("/login");
    } catch (error) {
      setLogoutError(
        "Data lokal belum dapat dibersihkan. Anda tetap masuk agar perubahan tidak hilang."
      );
    } finally {
      setLogoutPending(false);
    }
  };

  const handleTeacherLogout = async () => {
    void "ISSA:CMS.OFFLINE_ATTENDANCE.PROTECT_LOGOUT_WITH_PENDING";
    const activeTeacher = getActiveTeacherIdentity();
    setLogoutError("");
    try {
      if (
        !isDemo
        && activeTeacher?.id
        && await hasUnsyncedAttendanceChanges(activeTeacher.id)
      ) {
        setLogoutConfirmationOpen(true);
        return;
      }
    } catch (error) {
      setLogoutError(
        "Status perubahan lokal belum dapat diperiksa. Hapus data lokal untuk keluar dengan aman."
      );
      setLogoutConfirmationOpen(true);
      return;
    }
    await completeTeacherLogout();
  };

  return (
    <>
      <aside className={tw("teacher-sidebar relative z-shell w-full min-w-0 border-b border-issa-border bg-issa-page lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:min-h-[34rem] lg:flex-col lg:border-b-0 lg:border-r")}>
        <div className={tw("teacher-sidebar__brand flex h-14 min-w-0 items-center justify-between gap-3 px-4 lg:h-auto lg:px-4 lg:pb-5 lg:pt-5")}>
          <Link className={tw("flex min-w-0 items-center gap-2.5 rounded-control focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")} to="/" aria-label="ISSA Hari ini">
            <span className={tw("grid h-8 w-8 flex-none place-items-center rounded-lg border border-issa-border bg-issa-surface p-1.5 lg:h-9 lg:w-9")}>
              <img className={tw("block h-full w-full object-contain")} src={issaLogo} alt="" />
            </span>
            <span className={tw("min-w-0")}>
              <strong className={tw("block text-product font-bold tracking-product text-issa-text")}>ISSA</strong>
              <span className={tw("block truncate text-metadata text-issa-muted lg:hidden")}>{currentDomain}</span>
              <span className={tw("hidden text-metadata text-issa-muted lg:block")}>Ruang kerja guru</span>
            </span>
          </Link>
          <div className={tw("flex items-center gap-1 lg:hidden")}>
            {status && <div className={tw("[&_.offline-status__summary]:h-10 [&_.offline-status__summary]:min-h-10 [&_.offline-status__summary]:w-10 [&_.offline-status__summary]:justify-center [&_.offline-status__summary]:px-0 [&_.offline-status__label]:hidden [&_.offline-status__summary_.material-symbols-rounded]:hidden")}>{status}</div>}
            {onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className={tw("grid h-10 w-10 place-items-center rounded-control text-issa-muted transition-colors duration-fast hover:bg-issa-subtle hover:text-issa-text focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")}
                aria-label="Cari"
                aria-keyshortcuts="Control+K Meta+K"
              >
                <Icon name="search" className={tw("text-lg")} />
              </button>
            )}
            <button
              type="button"
              onClick={handleTeacherLogout}
              className={tw("grid h-10 w-10 place-items-center rounded-control text-issa-muted transition-colors duration-fast hover:bg-issa-subtle hover:text-issa-text focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus")}
              aria-label="Keluar"
            >
              <Icon name="logout" className={tw("text-lg")} />
            </button>
          </div>
        </div>

        <nav
          className={tw("teacher-sidebar__navigation fixed inset-x-0 bottom-0 z-shell border-t border-issa-border bg-[color-mix(in_srgb,var(--issa-surface)_96%,transparent)] px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(32,40,38,0.07)] backdrop-blur-xl lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:px-3 lg:pb-0 lg:pt-0 lg:shadow-none lg:backdrop-blur-none")}
          aria-label="Navigasi utama"
        >
          <ul className={tw("grid grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-0.5")}>
            {navigation.map((item) => {
              const active = item.matches(pathname);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={tw(
                      "teacher-sidebar__nav-link group relative flex min-h-[3.2rem] min-w-0 flex-col items-center justify-center gap-1 rounded-control px-2 py-1.5 text-center text-metadata font-semibold text-issa-muted transition-colors duration-fast hover:bg-issa-subtle hover:text-issa-text focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus motion-reduce:transition-none lg:min-h-[2.65rem] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2 lg:text-left lg:text-button",
                      active && "is-active bg-issa-subtle text-issa-text lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-5 lg:before:w-0.5 lg:before:-translate-y-1/2 lg:before:rounded-full lg:before:bg-issa-accent"
                    )}
                  >
                    <Icon name={item.icon} className={tw("flex-none text-[1.15rem] lg:w-5 lg:text-center", active && "text-issa-accent")} />
                    <span className={tw("truncate lg:hidden")}>{item.mobileLabel}</span>
                    <span className={tw("hidden truncate lg:block")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                to={workflowOwners.classCapture}
                aria-label="Catat kelas"
                aria-current={pathname === "/classroom-debrief" ? "page" : undefined}
                className={tw(
                  "teacher-sidebar__capture flex min-h-[3.2rem] min-w-0 flex-col items-center justify-center gap-1 rounded-control bg-issa-accent px-2 py-1.5 text-center text-metadata font-semibold text-issa-inverse transition-[background-color,transform] duration-fast hover:bg-[color-mix(in_srgb,var(--issa-accent)_86%,black)] focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus active:translate-y-px motion-reduce:transition-none lg:mt-4 lg:min-h-[2.65rem] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2 lg:text-left lg:text-button"
                )}
              >
                <Icon name="add" className={tw("flex-none text-[1.15rem] lg:w-5 lg:text-center")} />
                <span className={tw("truncate")}>Catat kelas</span>
              </Link>
            </li>
          </ul>
        </nav>

        <footer className={tw("teacher-sidebar__context mt-auto hidden min-w-0 border-t border-issa-border px-3 pb-4 pt-3 lg:grid lg:gap-2")}>
          {status && (
            <div className={tw("min-w-0 [&_.offline-status]:w-full [&_.offline-status]:justify-start [&_.offline-status_details]:w-full [&_.offline-status_summary]:w-full")}>{status}</div>
          )}
          {isDemo && (
            <div className={tw("rounded-control bg-[color-mix(in_srgb,var(--issa-warning)_8%,var(--issa-surface))] px-3 py-2")}>
              <strong className={tw("block text-metadata font-semibold text-issa-warning")}>Mode demo</strong>
              <span className={tw("mt-0.5 block text-metadata text-issa-muted")}>Akses hanya-baca</span>
            </div>
          )}
          {teacherName && (
            <div className={tw("flex min-w-0 items-center gap-2.5 rounded-control px-2 py-2")}>
              <span className={tw("grid h-8 w-8 flex-none place-items-center rounded-full bg-issa-subtle text-issa-accent")}>
                <Icon className={tw("text-lg")} name="account_circle" />
              </span>
              <div className={tw("min-w-0 flex-1")}>
                <span className={tw("block text-metadata text-issa-muted")}>Guru aktif</span>
                <strong className={tw("block truncate text-supporting font-semibold text-issa-text")}>{teacherName}</strong>
              </div>
            </div>
          )}
          <SecondaryButton type="button" onClick={handleTeacherLogout} className={tw("w-full justify-center")}>
            <Icon className={tw("text-lg")} name="logout" />
            Keluar
          </SecondaryButton>
        </footer>
      </aside>

      <Modal
        className={tw("teacher-logout-dialog")}
        dismissible={!logoutPending}
        onClose={() => {
          if (!logoutPending) setLogoutConfirmationOpen(false);
        }}
        show={logoutConfirmationOpen}
        size="issaCompact"
      >
        <ModalHeader>Perubahan kehadiran belum disinkronkan</ModalHeader>
        <ModalBody className={tw("teacher-logout-dialog__body")}>
          <p className={tw("text-body leading-relaxed text-issa-muted")}>Masih ada perubahan kehadiran yang belum disinkronkan.</p>
          <p className={tw("mt-2 text-body leading-relaxed text-issa-muted")}>Untuk mencegah data guru berikutnya tercampur, perubahan lokal harus dihapus sebelum keluar.</p>
          {logoutError && (
            <InlineNotice className={tw("mt-3")} role="alert" tone="danger">{logoutError}</InlineNotice>
          )}
        </ModalBody>
        <ModalFooter className={tw("teacher-logout-dialog__footer")}>
          <SecondaryButton
            type="button"
            disabled={logoutPending}
            onClick={() => setLogoutConfirmationOpen(false)}
          >
            Batal
          </SecondaryButton>
          <DestructiveButton
            type="button"
            loading={logoutPending}
            loadingLabel="Menghapus data lokal…"
            onClick={completeTeacherLogout}
          >
            Hapus perubahan lokal dan keluar
          </DestructiveButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
