type AppHeaderProps = {
  authError: string | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
  username: string;
};

const avatarColorClasses = [
  "is-blue",
  "is-green",
  "is-coral",
  "is-violet",
  "is-amber",
  "is-teal",
] as const;

function getAvatarColorClass(username: string) {
  const usernameHash = Array.from(username).reduce(
    (hash, character) => hash * 31 + character.charCodeAt(0),
    0,
  );

  return avatarColorClasses[Math.abs(usernameHash) % avatarColorClasses.length];
}

export function AppHeader({
  authError,
  isSigningOut,
  onSignOut,
  username,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      {authError ? (
        <p className="header-auth-error" role="alert">
          {authError}
        </p>
      ) : null}
      <div className="account-area">
        <div
          className={`account-avatar ${getAvatarColorClass(username)}`}
          aria-hidden="true"
        >
          {username[0].toUpperCase()}
        </div>
        <div className="account-copy">
          <strong>{username}</strong>
        </div>
        <button
          className="sign-out-button"
          disabled={isSigningOut}
          onClick={() => void onSignOut()}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
