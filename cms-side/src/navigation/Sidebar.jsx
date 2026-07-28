import { useState } from "react";
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
  { to: "/attendance", label: "Attendance", icon: "fact_check" },
  { to: "/schedule", label: "Schedule", icon: "calendar_month" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const completeTeacherLogout = async () => {
    const activeTeacher = getActiveTeacherIdentity();
    setLogoutPending(true);
    setLogoutError("");
    try {
      if (activeTeacher?.id) {
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
        activeTeacher?.id
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
          <p>Ruang kerja guru</p>
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

      <div className="teacher-sidebar__context">
        <p className="teacher-sidebar__context-index">Session index</p>
        <p className="teacher-sidebar__context-copy">Catat perkembangan siswa, attendance, dan nilai kelas Anda.</p>
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
      </div>
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
                Untuk mencegah data Teacher berikutnya tercampur, perubahan
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
