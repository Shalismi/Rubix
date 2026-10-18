export const PASSWORD_REQUIREMENTS =
  "Use 8 or more characters, including uppercase and lowercase letters and one number.";

export function getPasswordPolicyError(
  password: string,
  label = "Password",
) {
  if (password.length < 8 || password.length > 128) {
    return `${label} must be between 8 and 128 characters.`;
  }

  if (!/[A-Z]/.test(password)) {
    return `${label} must contain at least one uppercase letter.`;
  }

  if (!/[a-z]/.test(password)) {
    return `${label} must contain at least one lowercase letter.`;
  }

  if (!/[0-9]/.test(password)) {
    return `${label} must contain at least one number.`;
  }

  return null;
}
