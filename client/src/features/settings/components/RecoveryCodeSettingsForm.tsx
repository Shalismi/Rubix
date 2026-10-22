import { useState, type FormEvent } from "react";
import { replaceRecoveryCode } from "../../auth/api/authApi";
import { RecoveryCodeDisplay } from "../../auth/components/RecoveryCodeDisplay";
import type { AuthUser } from "../../auth/types";

type RecoveryCodeSettingsFormProps = {
  user: AuthUser;
  onUserChange: (user: AuthUser) => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not create a recovery code. Please try again.";
}

export function RecoveryCodeSettingsForm({
  user,
  onUserChange,
}: RecoveryCodeSettingsFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRecoveryCode(null);
    setIsSaving(true);

    try {
      const result = await replaceRecoveryCode({ currentPassword });

      setCurrentPassword("");
      setRecoveryCode(result.recoveryCode);
      onUserChange(result.user);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <div className="settings-account-detail">
        <div>
          <span>Recovery status</span>
          <strong>{user.hasRecoveryCode ? "Code ready" : "Not set up"}</strong>
        </div>
      </div>

      {recoveryCode ? <RecoveryCodeDisplay code={recoveryCode} /> : null}

      <div className="form-field">
        <label htmlFor="recovery-current-password">Current password</label>
        <input
          autoComplete="current-password"
          id="recovery-current-password"
          maxLength={128}
          minLength={8}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          type="password"
          value={currentPassword}
        />
      </div>

      {error ? (
        <p className="settings-message is-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="settings-actions">
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving
            ? "Creating code..."
            : user.hasRecoveryCode
              ? "Replace recovery code"
              : "Create recovery code"}
        </button>
      </div>
    </form>
  );
}
