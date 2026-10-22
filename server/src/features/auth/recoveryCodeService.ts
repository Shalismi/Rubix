import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 16;
const CODE_GROUP_LENGTH = 4;
const COMPACT_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{16}$/;
const FALLBACK_HASH = hashCompactCode("invalid-recovery-code");

function hashCompactCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function normalizeRecoveryCode(code: string) {
  return code.toUpperCase().replace(/[\s-]/g, "");
}

export function createRecoveryCode() {
  let compactCode = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    compactCode += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  const groups = compactCode.match(
    new RegExp(`.{1,${CODE_GROUP_LENGTH}}`, "g"),
  );

  return {
    code: groups!.join("-"),
    hash: hashCompactCode(compactCode),
  };
}

export function isRecoveryCodeValid(
  codeInput: string,
  expectedHash: string | null | undefined,
) {
  const compactCode = normalizeRecoveryCode(codeInput);
  const hasValidShape = COMPACT_CODE_PATTERN.test(compactCode);
  const hasStoredHash =
    typeof expectedHash === "string" && /^[a-f0-9]{64}$/.test(expectedHash);
  const candidateHash = hasValidShape
    ? hashCompactCode(compactCode)
    : FALLBACK_HASH;
  const storedHash = hasStoredHash ? expectedHash : FALLBACK_HASH;

  return (
    timingSafeEqual(
      Buffer.from(candidateHash, "hex"),
      Buffer.from(storedHash, "hex"),
    ) &&
    hasValidShape &&
    hasStoredHash
  );
}
