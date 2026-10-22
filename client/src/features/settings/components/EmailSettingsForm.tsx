import { useState, type FormEvent } from "react";
import {
  changeEmail,
  requestEmailVerification,
} from "../../auth/api/authApi";
import type { AuthUser } from "../../auth/types";

type EmailSettingsFormProps = {
  user: AuthUser;
  onUserChange: (user: AuthUser) => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not update your email. Please try again.";
}

export function EmailSettingsForm({
  user,
  onUserChange,
}: EmailSettingsFormProps) {
  const [email, setEmail] = useState(user.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [developmentVerificationUrl, setDevelopmentVerificationUrl] =
    useState<string | null>(null);
  const canUseLocalVerification = import.meta.env.DEV;
  const normalizedEmail = email.trim();
  const isRemovingEmail = Boolean(user.email) && normalizedEmail.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const updatedUser = await changeEmail({
        email: normalizedEmail || null,
        currentPassword,
      });

      setEmail(updatedUser.email ?? "");
      setCurrentPassword("");
      setDevelopmentVerificationUrl(null);
      setSuccessMessage(
        updatedUser.email ? "Email saved successfully." : "Email removed.",
      );
      onUserChange(updatedUser);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendVerification() {
    setError(null);
    setSuccessMessage(null);
    setDevelopmentVerificationUrl(null);
    setIsSendingVerification(true);

    try {
      const result = await requestEmailVerification();

      setSuccessMessage(result.message);
      setDevelopmentVerificationUrl(
        result.developmentVerificationUrl ?? null,
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSendingVerification(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <div className="settings-account-detail">
        <div>
          <span>Current email</span>
          <strong>{user.email ?? "Not added"}</strong>
        </div>
        {canUseLocalVerification && user.email ? (
          <span
            className={`email-status ${user.emailVerified ? "is-verified" : "is-pending"}`}
          >
            {user.emailVerified ? "Verified" : "Not verified"}
          </span>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="account-email">Email address</label>
        <input
          autoComplete="email"
          id="account-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </div>

      <div className="form-field">
        <label htmlFor="email-current-password">Current password</label>
        <input
          autoComplete="current-password"
          id="email-current-password"
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

      {successMessage ? (
        <p className="settings-message is-success" role="status">
          {successMessage}
        </p>
      ) : null}

      {developmentVerificationUrl ? (
        <a
          className="development-verification-link"
          href={developmentVerificationUrl}
        >
          Open local verification link
        </a>
      ) : null}

      <div className="settings-actions">
        {canUseLocalVerification && user.email && !user.emailVerified ? (
          <button
            className="secondary-button"
            disabled={
              isSendingVerification || normalizedEmail !== user.email
            }
            onClick={handleSendVerification}
            type="button"
          >
            {isSendingVerification ? "Sending..." : "Send verification"}
          </button>
        ) : null}
        <button
          className="primary-button"
          disabled={isSaving || (!user.email && !normalizedEmail)}
          type="submit"
        >
          {isSaving
            ? "Saving..."
            : isRemovingEmail
              ? "Remove email"
              : "Save email"}
        </button>
      </div>
    </form>
  );
}
