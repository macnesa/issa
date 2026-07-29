import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
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
  SecondaryButton,
} from "../shared/ui/ui";
import issaLogo from "../../assets/img/logo.png";
import "./teacher-navigation.css";

const navigation = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/attendance", label: "Kehadiran", icon: "fact_check" },
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
    <aside className="teacher-sidebar">
      <div className="teacher-sidebar__brand">
        <div className="teacher-sidebar__identity">
          <div className="teacher-sidebar__seal">
            <img src={issaLogo} alt="ISSA" />
          </div>
          <p>
            <strong>ISSA CMS</strong>
            <span>Ruang kerja guru</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleTeacherLogout}
          className="teacher-sidebar__mobile-logout"
        >
          Keluar
        </button>
      </div>

      <nav className="teacher-sidebar__navigation" aria-label="Navigasi utama">
        <ul>
          {navigation.map((navigationItem) => (
            <li key={navigationItem.to}>
              <NavLink
                end={navigationItem.end}
                to={navigationItem.to}
                className={({ isActive }) => `teacher-sidebar__nav-link ${isActive ? "is-active" : ""}`}
              >
                <span
                  className="material-symbols-outlined teacher-sidebar__nav-icon"
                  aria-hidden="true"
                >
                  {navigationItem.icon}
                </span>
                <span className="teacher-sidebar__nav-label">
                  {navigationItem.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="teacher-sidebar__context">
        {status && (
          <div className="teacher-sidebar__status">
            {status}
          </div>
        )}
        {isDemo && (
          <div className="border-l-2 border-[#6bbfbc] px-3 py-2 text-[#edf4f4]">
            <strong className="block text-[0.72rem] uppercase tracking-[0.08em]">
              Mode demo
            </strong>
            <span className="mt-0.5 block text-[0.68rem] text-[#bcd2d6]">
              Akses hanya-baca
            </span>
          </div>
        )}
        {teacherName && (
          <div className="teacher-sidebar__teacher">
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              account_circle
            </span>
            <div>
              <span>Guru</span>
              <strong>{teacherName}</strong>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleTeacherLogout}
          className="teacher-sidebar__logout"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            logout
          </span>
          Keluar
        </button>
      </footer>
      <Dialog
        open={logoutConfirmationOpen}
        onClose={() => {
          if (!logoutPending) setLogoutConfirmationOpen(false);
        }}
      >
        <DialogBackdrop className="issa-dialog-backdrop" />
        <div className="issa-dialog-container">
          <DialogPanel className="issa-dialog-panel teacher-logout-dialog">
            <div className="teacher-logout-dialog__body">
              <DialogTitle>Perubahan kehadiran belum disinkronkan</DialogTitle>
              <p>Masih ada perubahan kehadiran yang belum disinkronkan.</p>
              <p>
                Untuk mencegah data guru berikutnya tercampur, perubahan
                lokal harus dihapus sebelum keluar.
              </p>
              {logoutError && (
                <p role="alert" aria-live="assertive">{logoutError}</p>
              )}
            </div>
            <div className="teacher-logout-dialog__actions">
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
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </aside>
  );
}
