import { useState, type FormEvent } from "react";
import { changePassword } from "../../auth/api/authApi";
import {
  getPasswordPolicyError,
  PASSWORD_REQUIREMENTS,
} from "../../auth/utils/password";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not change your password. Please try again.";
}

export function PasswordSettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const passwordError = getPasswordPolicyError(newPassword, "New password");

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSaving(true);

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password changed successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="current-password">Current password</label>
        <input
          autoComplete="current-password"
          id="current-password"
          maxLength={128}
          minLength={8}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          type="password"
          value={currentPassword}
        />
      </div>

      <div className="form-field">
        <label htmlFor="new-password">New password</label>
        <input
          autoComplete="new-password"
          id="new-password"
          maxLength={128}
          minLength={8}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
        <span className="password-hint">{PASSWORD_REQUIREMENTS}</span>
      </div>

      <div className="form-field">
        <label htmlFor="confirm-new-password">Confirm new password</label>
        <input
          autoComplete="new-password"
          id="confirm-new-password"
          maxLength={128}
          minLength={8}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>

      {error ? (
        <p className="settings-message is-error" role="alert">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="settings-message is-success" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="settings-actions">
        <button
          className="primary-button"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Changing password..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
