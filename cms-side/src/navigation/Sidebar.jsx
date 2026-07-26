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
    <aside className="teacher-sidebar sticky top-0 z-20 w-full text-slate-100 md:flex md:min-h-screen md:w-72 md:flex-col">
      <div className="teacher-sidebar__brand mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:block md:w-full md:px-5 md:py-6">
        <div className="flex items-center gap-3">
          <div className="teacher-sidebar__seal h-12 w-12">
            <img src={issaLogo} alt="ISSA" />
          </div>
          <p className="text-xs text-[#c7e1eb]">Ruang kerja guru</p>
        </div>
        <button type="button" onClick={handleTeacherLogout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white md:hidden">Keluar</button>
      </div>

      <nav className="overflow-x-auto px-3 py-2 md:px-4 md:py-8" aria-label="Navigasi utama">
        <ul className="flex min-w-max gap-1 md:block md:space-y-1">
          {navigation.map((navigationItem) => (
            <li key={navigationItem.to}>
              <NavLink end={navigationItem.end} to={navigationItem.to} className={({ isActive }) => `teacher-sidebar__nav-link flex min-h-11 items-center gap-3 px-3 py-2 text-sm font-semibold transition ${isActive ? "is-active" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                <span className="material-symbols-outlined text-[20px]">{navigationItem.icon}</span>{navigationItem.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="teacher-sidebar__context mt-auto hidden px-5 py-5 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f2e291]">Session index</p>
        <p className="mt-2 text-sm leading-5 text-slate-100">Catat perkembangan siswa, attendance, dan nilai kelas Anda.</p>
        <button type="button" onClick={handleTeacherLogout} className="teacher-sidebar__logout mt-5 inline-flex min-h-10 items-center gap-2 px-1 py-2 text-sm font-semibold text-[#c7e1eb] hover:text-white"><span className="material-symbols-outlined text-[18px]">logout</span>Keluar</button>
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
              <button
                type="button"
                disabled={logoutPending}
                onClick={() => setLogoutConfirmationOpen(false)}
              >
                Tetap masuk
              </button>
              <button
                type="button"
                disabled={logoutPending}
                onClick={completeTeacherLogout}
              >
                Hapus perubahan lokal dan keluar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </aside>
  );
}
