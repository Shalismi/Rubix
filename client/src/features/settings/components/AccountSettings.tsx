import {
  FONT_OPTIONS,
  isFontChoice,
  type FontChoice,
} from "../../../app/config/fonts";
import type { AuthUser } from "../../auth/types";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { PasswordSettingsForm } from "./PasswordSettingsForm";
import { RecoveryCodeSettingsForm } from "./RecoveryCodeSettingsForm";

type AccountSettingsProps = {
  user: AuthUser;
  onUserChange: (user: AuthUser) => void;
  font: FontChoice;
  onFontChange: (font: FontChoice) => void;
};

export function AccountSettings({
  user,
  onUserChange,
  font,
  onFontChange,
}: AccountSettingsProps) {
  return (
    <main className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your Rubix account.</p>
      </header>

      <section className="settings-section" aria-labelledby="font-heading">
        <div className="settings-section-heading">
          <h2 id="font-heading">Font</h2>
          <p>Choose the typeface used throughout Rubix.</p>
        </div>

        <div className="font-control">
          <label htmlFor="interface-font">Interface font</label>
          <select
            id="interface-font"
            value={font}
            onChange={(event) => {
              const nextFont = event.currentTarget.value;
              if (isFontChoice(nextFont)) {
                onFontChange(nextFont);
              }
            }}
          >
            {Object.entries(FONT_OPTIONS).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="font-preview" aria-label="Font preview">
            <strong>Make room for what matters.</strong>
            <p>Today · Daily Streak · Calendar</p>
            <span>Aa Bb Cc · 0123456789</span>
          </div>
          <p className="font-note">
            Applies immediately. Saved for this account in this browser.
          </p>
        </div>
      </section>

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
