import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../api/authApi";

type VerificationStatus = "checking" | "error" | "success";

export function EmailVerificationScreen() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [status, setStatus] = useState<VerificationStatus>(
    token ? "checking" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : "This verification link is missing its token.",
  );
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    if (!token) {
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not verify this email.",
        );
      });
  }, [token]);

  return (
    <main className="auth-shell">
      <section className="auth-panel verification-panel" aria-live="polite">
        <div className="auth-brand">
          <span className="sidebar-logo-mark" aria-hidden="true" />
          <span>Rubix</span>
        </div>

        <div className="verification-result">
          <span
            className={`verification-symbol is-${status}`}
            aria-hidden="true"
          >
            {status === "checking" ? "..." : status === "success" ? "✓" : "!"}
          </span>
          <h1>
            {status === "checking"
              ? "Checking your link"
              : status === "success"
                ? "Email verified"
                : "Verification failed"}
          </h1>
          <p>{message}</p>
        </div>

        {status !== "checking" ? (
          <a className="primary-button verification-action" href="/">
            Continue to Rubix
          </a>
        ) : null}
      </section>
    </main>
  );
}
