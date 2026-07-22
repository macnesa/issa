import { NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/attendance", label: "Attendance", icon: "fact_check" },
  { to: "/schedule", label: "Schedule", icon: "calendar_month" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="sticky top-0 z-20 w-full border-b border-slate-800 bg-slate-950 text-slate-100 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:block md:px-5 md:py-6">
        <div className="flex items-center gap-3">
          <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1677952222/logo_cv5mzy.png" className="h-9 w-9 rounded-lg object-contain" alt="ISSA" />
          <div><p className="font-Comfortaa text-sm font-semibold tracking-wide">ISSA</p><p className="text-xs text-slate-400">Ruang kerja guru</p></div>
        </div>
        <button type="button" onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white md:hidden">Keluar</button>
      </div>

      <nav className="overflow-x-auto border-t border-slate-800 px-3 py-2 md:border-0 md:px-4 md:py-4" aria-label="Navigasi utama">
        <ul className="flex min-w-max gap-1 md:block md:space-y-1">
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink end={item.end} to={item.to} className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>{item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden border-t border-slate-800 px-5 py-5 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Teacher workspace</p>
        <p className="mt-2 text-sm leading-5 text-slate-300">Catat perkembangan siswa, attendance, dan nilai kelas Anda.</p>
        <button type="button" onClick={logout} className="mt-5 flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">Keluar</button>
      </div>
    </aside>
  );
}
