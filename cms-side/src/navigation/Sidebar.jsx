import { tw } from "../shared/ui/tw";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import {
  hasUnsyncedAttendanceChanges,
} from "../offline-workspace/attendanceOffline";
import {
  DestructiveButton,
  InlineNotice,
  SecondaryButton,
} from "../shared/ui/ui";
import Icon from "../shared/ui/Icon";
import issaLogo from "../../assets/img/logo.png";

const navigation = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/attendance", label: "Kehadiran", icon: "fact_check" },
  { to: "/classroom-debrief", label: "Classroom Debrief", icon: "edit_note" },
  { to: "/schedule", label: "Jadwal", icon: "calendar_month" },
];

export default function Sidebar({ status = null }) {
  const navigate = useNavigate();
  const [teacherIdentity, setTeacherIdentity] = useState(
    getActiveTeacherIdentity
  );
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const teacherName = teacherIdentity?.name?.trim();
  const isDemo = isTeacherDemoSession();

  useEffect(() => {
    const refreshTeacherIdentity = () => {
      setTeacherIdentity(getActiveTeacherIdentity());
    };
    window.addEventListener(
      "issa:teacher-identity-changed",
      refreshTeacherIdentity
    );
    return () => {
      window.removeEventListener(
        "issa:teacher-identity-changed",
        refreshTeacherIdentity
      );
    };
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
    <aside className={tw("teacher-sidebar relative [z-index:var(--issa-z-shell)] flex w-full min-w-0 flex-col [border-bottom:var(--issa-border-width)_solid_var(--issa-text)] bg-issa-text text-issa-inverse lg:sticky lg:top-0 lg:[width:var(--teacher-sidebar-width)] lg:[height:100svh] lg:[min-height:32rem] lg:[border-right:var(--issa-border-width)_solid_var(--issa-text)] lg:[border-bottom:0]")}>
      <div className={tw("teacher-sidebar__brand flex min-w-0 [min-height:var(--teacher-utility-height)] items-center justify-between gap-4 [border-bottom:var(--issa-border-width)_solid_____color-mix(_______in_srgb,_______var(--issa-text-inverse-muted)_28%,_______transparent_____)] py-2 px-4 lg:pr-4 lg:pl-4")}>
        <div className={tw("teacher-sidebar__identity flex min-w-0 items-center gap-3 max-sm:gap-2")}>
          <div className={tw("teacher-sidebar__seal h-12 w-12 flex-none max-sm:h-10 max-sm:w-10")}>
            <img className={tw("block h-full w-full object-contain")} src={issaLogo} alt="ISSA" />
          </div>
          <p className={tw("grid min-w-0 gap-1 text-metadata font-medium leading-tight text-issa-inverse-muted")}>
            <strong className={tw("text-product font-bold tracking-product text-issa-inverse")}>ISSA CMS</strong>
            <span>Ruang kerja guru</span>
          </p>
        </div>
        <SecondaryButton
          type="button"
          onClick={handleTeacherLogout}
          className={tw("teacher-sidebar__mobile-logout flex-none lg:hidden")}
        >
          Keluar
        </SecondaryButton>
      </div>

      <nav className={tw("teacher-sidebar__navigation min-w-0 overflow-x-auto [border-bottom:var(--issa-border-width)_solid_____color-mix(_______in_srgb,_______var(--issa-text-inverse-muted)_24%,_______transparent_____)] py-2 px-3 [scrollbar-width:thin] [scrollbar-color:var(--issa-border-strong)_transparent] lg:[overflow-x:visible] lg:[padding:var(--issa-space-6)_var(--issa-space-4)] max-sm:pr-2 max-sm:pl-2")} aria-label="Navigasi utama">
        <ul className={tw("flex w-max min-w-full gap-1 lg:grid lg:w-full lg:min-w-0")}>
          {navigation.map((navigationItem) => (
            <li key={navigationItem.to}>
              <NavLink
                end={navigationItem.end}
                to={navigationItem.to}
                className={({ isActive }) => tw(
                  "teacher-sidebar__nav-link relative flex min-h-control items-center gap-3 rounded-control border border-transparent border-l-emphasis border-l-transparent px-3 py-2 text-button font-semibold leading-tight text-issa-inverse-muted transition-colors duration-default hover:border-[color-mix(in_srgb,var(--issa-text-inverse-muted)_28%,transparent)] hover:border-l-issa-selection hover:bg-[color-mix(in_srgb,var(--issa-surface-subtle)_10%,transparent)] hover:text-issa-inverse focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-4 focus-visible:outline-issa-focus motion-reduce:transition-none max-sm:justify-center max-sm:gap-1 max-sm:px-1 max-sm:text-supporting",
                  isActive && "is-active border-issa-border-strong border-l-issa-selection bg-issa-subtle text-issa-text hover:border-issa-border-strong hover:border-l-issa-selection hover:bg-issa-subtle hover:text-issa-text"
                )}
              >
                <Icon
                  name={navigationItem.icon}
                  className={tw("teacher-sidebar__nav-icon [width:1.25rem] [flex:0_0_1.25rem] text-xl text-center")}
                />
                <span className={tw("teacher-sidebar__nav-label min-w-0 [overflow-wrap:anywhere] max-sm:[overflow-wrap:normal] max-sm:whitespace-nowrap")}>
                  {navigationItem.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <footer className={tw("teacher-sidebar__context flex min-w-0 items-center justify-end gap-2 [margin-top:auto] [border-top:var(--issa-border-width)_solid_____color-mix(_______in_srgb,_______var(--issa-text-inverse-muted)_28%,_______transparent_____)] [background:color-mix(in_srgb,_var(--issa-text)_88%,_black)] py-2 px-3 lg:grid lg:[grid-template-columns:minmax(0,_1fr)] lg:[align-items:initial] lg:justify-items-stretch lg:gap-3 lg:p-4")}>
        {status && (
          <div className={tw("teacher-sidebar__status min-w-0 [&_.offline-status]:w-full [&_.offline-status]:justify-start [&_.offline-status_details]:w-full [&_.offline-status_summary]:w-full lg:w-full max-sm:flex-1")}>
            {status}
          </div>
        )}
        {isDemo && (
          <div className={tw("teacher-sidebar__demo border-l-emphasis border-issa-selection px-3 py-2 text-issa-inverse")}>
            <strong className={tw("block text-metadata font-bold uppercase tracking-metadata")}>Mode demo</strong>
            <span className={tw("mt-1 block text-metadata text-issa-inverse-muted")}>Akses hanya-baca</span>
          </div>
        )}
        {teacherName && (
          <div className={tw("teacher-sidebar__teacher hidden min-w-0 items-center gap-2 [border-top:var(--issa-border-width)_solid_____color-mix(_______in_srgb,_______var(--issa-text-inverse-muted)_24%,_______transparent_____)] pt-3 lg:flex")}>
            <Icon className={tw("flex-none text-section-title text-issa-selection")} name="account_circle" />
            <div className={tw("grid min-w-0 gap-1")}>
              <span className={tw("text-metadata text-issa-inverse-muted")}>Guru</span>
              <strong className={tw("overflow-hidden text-ellipsis whitespace-nowrap text-supporting font-semibold text-issa-inverse")}>{teacherName}</strong>
            </div>
          </div>
        )}
        <SecondaryButton
          type="button"
          onClick={handleTeacherLogout}
          className={tw("teacher-sidebar__logout flex-none lg:w-full lg:justify-center max-lg:hidden")}
        >
          <Icon className={tw("text-section-title")} name="logout" />
          Keluar
        </SecondaryButton>
      </footer>
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
              <p className={tw("mt-2 text-body leading-normal text-issa-muted")}>Masih ada perubahan kehadiran yang belum disinkronkan.</p>
              <p className={tw("mt-2 text-body leading-normal text-issa-muted")}>
                Untuk mencegah data guru berikutnya tercampur, perubahan
                lokal harus dihapus sebelum keluar.
              </p>
              {logoutError && (
                <InlineNotice className={tw("mt-3")} role="alert" tone="danger">
                  {logoutError}
                </InlineNotice>
              )}
        </ModalBody>
        <ModalFooter className={tw("teacher-logout-dialog__actions gap-3 [&_button]:max-w-full [&_button]:whitespace-normal")}>
              <SecondaryButton
                type="button"
                disabled={logoutPending}
                onClick={() => setLogoutConfirmationOpen(false)}
              >
                Tetap masuk
              </SecondaryButton>
              <DestructiveButton
                type="button"
                disabled={logoutPending}
                onClick={completeTeacherLogout}
              >
                Hapus perubahan lokal dan keluar
              </DestructiveButton>
        </ModalFooter>
      </Modal>
    </aside>
  );
}
