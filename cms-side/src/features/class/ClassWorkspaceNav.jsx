import { Link, useLocation } from "react-router-dom";
import { tw } from "../../shared/ui/tw";
import Icon from "../../shared/ui/Icon";
import { workflowOwners } from "../../navigation/workflowRoutes";

const items = [
  { to: workflowOwners.class, label: "Ringkasan", icon: "school" },
  { to: workflowOwners.classAttendance, label: "Kehadiran", icon: "fact_check" },
  { to: workflowOwners.classSchedule, label: "Jadwal", icon: "calendar_month" },
];

export default function ClassWorkspaceNav() {
  const { pathname } = useLocation();
  return (
    <nav className={tw("class-workspace-nav mb-6 border-b border-issa-border")} aria-label="Workspace kelas">
      <div className={tw("flex min-w-0 gap-1 overflow-x-auto")}>
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={tw(
                "relative inline-flex min-h-control flex-none items-center gap-2 px-3 py-2 text-button font-semibold text-issa-muted transition-colors duration-fast hover:text-issa-text focus-visible:outline focus-visible:outline-emphasis focus-visible:-outline-offset-2 focus-visible:outline-issa-focus",
                active && "text-issa-text after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-issa-accent"
              )}
            >
              <Icon name={item.icon} className={tw("text-base", active && "text-issa-accent")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
