import { RecoveryCodeDisplay } from "./RecoveryCodeDisplay";
import { AuthBrand } from "./AuthBrand";

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
        <AuthBrand />

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
