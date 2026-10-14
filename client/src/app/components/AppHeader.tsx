type AppHeaderProps = {
  isBackendConnected: boolean;
};

export function AppHeader({ isBackendConnected }: AppHeaderProps) {
  const connectionLabel = isBackendConnected
    ? "Backend connected"
    : "Backend unavailable";

  return (
    <header className="app-header">
      <div className="account-area" title={connectionLabel}>
        <div className="account-avatar" aria-hidden="true">
          GU
        </div>
        <div className="account-copy">
          <strong>Guest User</strong>
          <span>Guest workspace</span>
        </div>
      </div>
    </header>
  );
}
