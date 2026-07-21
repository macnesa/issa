import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const itemClass = "flex rounded-md p-2 cursor-pointer hover:bg-light-white text-gray-300 text-sm items-center gap-x-4";

  return (
    <div className={`${open ? "w-72" : "w-20"} min-h-screen bg-gray-900 p-5 pt-8 relative duration-300 dark:bg-gray-700 dark:text-gray-400`}>
      <img
        src="https://res.cloudinary.com/dslzpyibe/image/upload/v1677950995/assets/control_jdqubc.png"
        className={`absolute cursor-pointer -right-3 top-9 w-7 border-dark-purple border-2 rounded-full ${!open && "rotate-180"}`}
        alt="Toggle sidebar"
        onClick={() => setOpen(!open)}
      />
      <div className="flex gap-x-4 items-center"><img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1677952222/logo_cv5mzy.png" className={`cursor-pointer duration-500 ${open && "rotate-[360deg]"}`} alt="ISSA" /></div>
      <ul className="pt-6">
        <Link to="/"><li className={itemClass}><span className="material-symbols-outlined">dashboard</span><span className={`${!open && "hidden"} origin-left duration-200 font-Comfortaa text-[1rem]`}>Dashboard</span></li></Link>
        <Link to="/attendance"><li className={itemClass}><span className="material-symbols-outlined">room_preferences</span><span className={`${!open && "hidden"} origin-left duration-200 font-Comfortaa text-[1rem]`}>Attendances</span></li></Link>
        <Link to="/schedule"><li className={itemClass}><span className="material-symbols-outlined">date_range</span><span className={`${!open && "hidden"} origin-left duration-200 font-Comfortaa text-[1rem]`}>Schedules</span></li></Link>
        <li onClick={logout} className={itemClass}><span className="material-symbols-outlined">logout</span><span className={`${!open && "hidden"} origin-left duration-200 font-Comfortaa text-[1rem]`}>Logout</span></li>
        <li onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={itemClass}><span className="material-symbols-outlined">radio_button_checked</span><span className={`${!open && "hidden"} origin-left duration-200 font-Comfortaa text-[1rem]`}>Dark Mode</span></li>
      </ul>
    </div>
  );
};

export default Sidebar;
