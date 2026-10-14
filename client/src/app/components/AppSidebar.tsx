export type AppView = "dashboard" | "calendar";

type NavItem = {
  view?: AppView;
  label: string;
  icon: "main" | "calendar" | "settings";
};

const primaryNavItems: NavItem[] = [
  { label: "Dashboard", icon: "main", view: "dashboard" },
  { label: "Calendar", icon: "calendar", view: "calendar" },
  { label: "Settings", icon: "settings" },
];

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

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M12 3v3M12 18v3M4.2 6.5l2.1 2.1M17.7 15.4l2.1 2.1M3 12h3M18 12h3M4.2 17.5l2.1-2.1M17.7 8.6l2.1-2.1" />
    </svg>
  );
}

function SidebarNavItem({
  activeView,
  item,
  onSelectView,
}: {
  activeView: AppView;
  item: NavItem;
  onSelectView: (view: AppView) => void;
}) {
  const isActive = item.view === activeView;

  return (
    <button
      className={`sidebar-nav-item${isActive ? " is-active" : ""}`}
      type="button"
      onClick={() => {
        if (item.view) {
          onSelectView(item.view);
        }
      }}
    >
      <span className="sidebar-nav-icon">
        <SidebarIcon icon={item.icon} />
      </span>
      <span>{item.label}</span>
    </button>
  );
}

type AppSidebarProps = {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
};

export function AppSidebar({ activeView, onSelectView }: AppSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Rubix navigation">
      <div className="sidebar-brand">
        <span className="sidebar-logo-mark" aria-hidden="true" />
        <span>Rubix</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {primaryNavItems.map((item) => (
          <SidebarNavItem
            activeView={activeView}
            item={item}
            key={item.label}
            onSelectView={onSelectView}
          />
        ))}
      </nav>
    </aside>
  );
}
