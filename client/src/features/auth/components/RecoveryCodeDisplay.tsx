import { useState } from "react";

type RecoveryCodeDisplayProps = {
  code: string;
};

export function RecoveryCodeDisplay({ code }: RecoveryCodeDisplayProps) {
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="recovery-code-block">
      <div className="recovery-code-value">
        <code>{code}</code>
        <button
          className="secondary-button"
          onClick={handleCopy}
          type="button"
        >
          {copyStatus === "copied" ? "Copied" : "Copy code"}
        </button>
      </div>
      <p aria-live="polite" className="recovery-code-status">
        {copyStatus === "error"
          ? "Copy failed. Select the code and copy it manually."
          : "Store this code somewhere private. It will not be shown again."}
      </p>
    </div>
  );
}
