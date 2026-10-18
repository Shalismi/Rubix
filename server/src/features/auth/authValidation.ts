import type {
  AuthInput,
  AuthValidationResult,
  PasswordChangeInput,
  PasswordChangeValidationResult,
} from "./authTypes.js";

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /[0-9]/;

type PasswordValidationResult =
  | { data: string }
  | { error: string };

function validatePassword(
  password: unknown,
  label: string,
  requireStrongPassword: boolean,
): PasswordValidationResult {
  if (typeof password !== "string") {
    return { error: `${label} is required.` };
  }

  if (password.length < 8 || password.length > 128) {
    return { error: `${label} must be between 8 and 128 characters.` };
  }

  if (requireStrongPassword && !UPPERCASE_PATTERN.test(password)) {
    return { error: `${label} must contain at least one uppercase letter.` };
  }

  if (requireStrongPassword && !LOWERCASE_PATTERN.test(password)) {
    return { error: `${label} must contain at least one lowercase letter.` };
  }

  if (requireStrongPassword && !NUMBER_PATTERN.test(password)) {
    return { error: `${label} must contain at least one number.` };
  }

  return { data: password };
}

function validateAuthInput(
  input: AuthInput,
  requireStrongPassword: boolean,
): AuthValidationResult {
  if (typeof input.username !== "string") {
    return { error: "Username is required." };
  }

  const username = input.username.trim().toLowerCase();

  if (username.length < 3 || username.length > 30) {
    return { error: "Username must be between 3 and 30 characters." };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  const password = validatePassword(
    input.password,
    "Password",
    requireStrongPassword,
  );

  if ("error" in password) {
    return password;
  }

  return {
    data: {
      username,
      password: password.data,
    },
  };
}

export function validateRegistrationInput(input: AuthInput) {
  return validateAuthInput(input, true);
}

export function validateLoginInput(input: AuthInput) {
  return validateAuthInput(input, false);
}

export function validatePasswordChangeInput(
  input: PasswordChangeInput,
): PasswordChangeValidationResult {
  const currentPassword = validatePassword(
    input.currentPassword,
    "Current password",
    false,
  );

  if ("error" in currentPassword) {
    return { error: "Current password is invalid." };
  }

  const newPassword = validatePassword(input.newPassword, "New password", true);

  if ("error" in newPassword) {
    return newPassword;
  }

  return {
    data: {
      currentPassword: currentPassword.data,
      newPassword: newPassword.data,
    },
  };
}
