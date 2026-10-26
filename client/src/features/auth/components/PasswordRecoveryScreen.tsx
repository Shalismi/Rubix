import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { getAccountPath, getReturnPath } from "../../../app/config/routes";
import { recoverPassword } from "../api/authApi";
import {
  getPasswordPolicyError,
  PASSWORD_REQUIREMENTS,
} from "../utils/password";
import { RecoveryCodeDisplay } from "./RecoveryCodeDisplay";
import { AuthBrand } from "./AuthBrand";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not reset your password. Please try again.";
}

export function PasswordRecoveryScreen() {
  const location = useLocation();
  const signInPath = getAccountPath("login", getReturnPath(location.search));
  const [identifier, setIdentifier] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [replacementCode, setReplacementCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const passwordError = getPasswordPolicyError(newPassword, "New password");

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await recoverPassword({
        identifier,
        recoveryCode,
        newPassword,
      });

      setReplacementCode(result.recoveryCode);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel recovery-panel" aria-labelledby="recovery-title">
        <AuthBrand />

        {replacementCode ? (
          <>
            <div className="auth-heading">
              <h1 id="recovery-title">Password reset</h1>
              <p>Your old recovery code has been replaced.</p>
            </div>

            <RecoveryCodeDisplay code={replacementCode} />

            {/* Recovery revokes sessions; re-check the cookie on return. */}
            <Link className="primary-button auth-submit auth-link-button" reloadDocument to={signInPath}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1 id="recovery-title">Reset your password</h1>
              <p>Enter your account details and saved recovery code.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="recovery-identifier">Username or email</label>
                <input
                  autoComplete="username"
                  autoFocus
                  id="recovery-identifier"
                  maxLength={254}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  type="text"
                  value={identifier}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="recovery-code">Recovery code</label>
                <input
                  autoCapitalize="characters"
                  autoComplete="off"
                  id="recovery-code"
                  maxLength={32}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                  spellCheck={false}
                  type="text"
                  value={recoveryCode}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="recovery-new-password">New password</label>
                <input
                  autoComplete="new-password"
                  id="recovery-new-password"
                  maxLength={128}
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
                <span className="auth-field-hint">{PASSWORD_REQUIREMENTS}</span>
              </div>

              <div className="auth-field">
                <label htmlFor="recovery-confirm-password">
                  Confirm new password
                </label>
                <input
                  autoComplete="new-password"
                  id="recovery-confirm-password"
                  maxLength={128}
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>

              {error ? (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                className="primary-button auth-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Resetting password..." : "Reset password"}
              </button>

              <Link className="auth-back-link" to={signInPath}>
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
