import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  return (
    <div className="flex bg-white dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
      </div>
      <Outlet />

      {/* <aside class="fixed">
        <Sidebar />
      </aside>
      <main class="flex-1 ml-44">
        <Outlet />
      </main> */}
    </div>
  );
}
