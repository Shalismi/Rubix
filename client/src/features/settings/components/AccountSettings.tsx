import type { AuthUser } from "../../auth/types";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { PasswordSettingsForm } from "./PasswordSettingsForm";
import { RecoveryCodeSettingsForm } from "./RecoveryCodeSettingsForm";

type AccountSettingsProps = {
  user: AuthUser;
  onUserChange: (user: AuthUser) => void;
};

export function AccountSettings({
  user,
  onUserChange,
}: AccountSettingsProps) {
  return (
    <main className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your Rubix account.</p>
      </header>

      <section className="settings-section" aria-labelledby="account-heading">
        <div className="settings-section-heading">
          <h2 id="account-heading">Account</h2>
          <p className="settings-username">Signed in as {user.username}</p>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="email-heading">
        <div className="settings-section-heading">
          <h2 id="email-heading">Email</h2>
          <p>Optional sign-in address.</p>
        </div>

        <EmailSettingsForm user={user} onUserChange={onUserChange} />
      </section>

      <section className="settings-section" aria-labelledby="password-heading">
        <div className="settings-section-heading">
          <h2 id="password-heading">Password</h2>
          <p>Changing it signs out other sessions for this account.</p>
        </div>

        <PasswordSettingsForm />
      </section>

      <section className="settings-section" aria-labelledby="recovery-heading">
        <div className="settings-section-heading">
          <h2 id="recovery-heading">Account recovery</h2>
          <p>Replace the one-time code used for password resets.</p>
        </div>

        <RecoveryCodeSettingsForm
          user={user}
          onUserChange={onUserChange}
        />
      </section>
    </main>
  );
}
