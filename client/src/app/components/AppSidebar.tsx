type NavItem = {
  label: string;
  icon: "main" | "calendar" | "workspaces" | "settings";
  isActive?: boolean;
};

const primaryNavItems: NavItem[] = [
  { label: "Dashboard", icon: "main", isActive: true },
  { label: "Calendar", icon: "calendar" },
  { label: "Workspaces", icon: "workspaces" },
];

const secondaryNavItems: NavItem[] = [{ label: "Settings", icon: "settings" }];

function SidebarIcon({ icon }: { icon: NavItem["icon"] }) {
  if (icon === "main") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20h-5v-5H9v5H4v-9.5Z" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (icon === "workspaces") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 5h6v6H5V5ZM13 5h6v6h-6V5ZM5 13h6v6H5v-6ZM13 13h6v6h-6v-6Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M12 3v3M12 18v3M4.2 6.5l2.1 2.1M17.7 15.4l2.1 2.1M3 12h3M18 12h3M4.2 17.5l2.1-2.1M17.7 8.6l2.1-2.1" />
    </svg>
  );
}

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <button
      className={`sidebar-nav-item${item.isActive ? " is-active" : ""}`}
      type="button"
    >
      <span className="sidebar-nav-icon">
        <SidebarIcon icon={item.icon} />
      </span>
      <span>{item.label}</span>
    </button>
  );
}

export function AppSidebar() {
  return (
    <aside className="app-sidebar" aria-label="Rubix navigation">
      <div className="sidebar-brand">
        <span className="sidebar-logo-mark" aria-hidden="true" />
        <span>Rubix</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {primaryNavItems.map((item) => (
          <SidebarNavItem item={item} key={item.label} />
        ))}
      </nav>

      <nav className="sidebar-nav sidebar-nav-bottom" aria-label="Settings">
        {secondaryNavItems.map((item) => (
          <SidebarNavItem item={item} key={item.label} />
        ))}
      </nav>
    </aside>
  );
}
