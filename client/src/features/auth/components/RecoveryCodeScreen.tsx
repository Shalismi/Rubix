import { RecoveryCodeDisplay } from "./RecoveryCodeDisplay";

type RecoveryCodeScreenProps = {
  code: string;
  onContinue: () => void;
};

export function RecoveryCodeScreen({
  code,
  onContinue,
}: RecoveryCodeScreenProps) {
  return (
    <main className="auth-shell">
      <section className="auth-panel recovery-panel" aria-labelledby="recovery-title">
        <div className="auth-brand">
          <span className="sidebar-logo-mark" aria-hidden="true" />
          <span>Rubix</span>
        </div>

        <div className="auth-heading">
          <h1 id="recovery-title">Save your recovery code</h1>
          <p>
            This is the only way to reset your password without email.
          </p>
        </div>

        <RecoveryCodeDisplay code={code} />

        <button
          className="primary-button auth-submit"
          onClick={onContinue}
          type="button"
        >
          Continue to Rubix
        </button>
      </section>
    </main>
  );
}
