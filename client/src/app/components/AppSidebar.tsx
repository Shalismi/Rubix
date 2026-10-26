import { NavLink } from "react-router";
import rubixCubeLogo from "../../assets/rubix-cube.png";
import { APP_PATHS, type AppView } from "../config/routes";

type NavItem = {
  view: AppView;
  label: string;
  icon: "main" | "calendar" | "trash" | "settings";
};

const primaryNavItems: NavItem[] = [
  { label: "Dashboard", icon: "main", view: "dashboard" },
  { label: "Calendar", icon: "calendar", view: "calendar" },
  { label: "Trash", icon: "trash", view: "trash" },
  { label: "Settings", icon: "settings", view: "settings" },
];

function SidebarIcon({ icon }: { icon: NavItem["icon"] }) {
  if (icon === "main") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2" />
      </svg>
    );
  }

  if (icon === "trash") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 7h16M9 7V4h6v3M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="m9 3-.5 2-1.6.9L5 5.3 2.8 9l1.5 1.5v3L2.8 15 5 18.7l1.9-.6 1.6.9.5 2h6l.5-2 1.6-.9 1.9.6 2.2-3.7-1.5-1.5v-3L21.2 9 19 5.3l-1.9.6-1.6-.9-.5-2H9Z" />
    </svg>
  );
}

function SidebarNavItem({
  item,
}: {
  item: NavItem;
}) {
  return (
    <NavLink
      className={({ isActive }) => `sidebar-nav-item${isActive ? " is-active" : ""}`}
      end
      to={APP_PATHS[item.view]}
    >
      <span className="sidebar-nav-icon">
        <SidebarIcon icon={item.icon} />
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export function AppSidebar() {
  return (
    <aside className="app-sidebar" aria-label="Rubix navigation">
      <div className="sidebar-brand">
        <img
          className="sidebar-logo-image"
          src={rubixCubeLogo}
          alt=""
          width={48}
          height={48}
        />
        <span>Rubix</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {primaryNavItems.map((item) => (
          <SidebarNavItem item={item} key={item.label} />
        ))}
      </nav>
    </aside>
  );
}
