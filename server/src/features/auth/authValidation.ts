import type {
  EmailChangeInput,
  EmailChangeValidationResult,
  LoginInput,
  LoginValidationResult,
  PasswordChangeInput,
  PasswordChangeValidationResult,
  PasswordRecoveryInput,
  PasswordRecoveryValidationResult,
  RecoveryCodeChangeInput,
  RecoveryCodeChangeValidationResult,
  RegistrationInput,
  RegistrationValidationResult,
} from "./authTypes.js";

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /[0-9]/;

type PasswordValidationResult =
  | { data: string }
  | { error: string };

type EmailValidationResult =
  | { data: string | null }
  | { error: string };

type UsernameValidationResult =
  | { data: string }
  | { error: string };

type IdentifierValidationResult =
  | {
      data: {
        identifier: string;
        identifierType: "email" | "username";
      };
    }
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

function validateUsername(usernameInput: unknown): UsernameValidationResult {
  if (typeof usernameInput !== "string") {
    return { error: "Username is required." };
  }

  const username = usernameInput.trim().toLowerCase();

  if (username.length < 3 || username.length > 30) {
    return { error: "Username must be between 3 and 30 characters." };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  return { data: username };
}

function validateEmail(emailInput: unknown): EmailValidationResult {
  if (emailInput === undefined || emailInput === null || emailInput === "") {
    return { data: null };
  }

  if (typeof emailInput !== "string") {
    return { error: "Email must be a valid address." };
  }

  const email = emailInput.trim().toLowerCase();

  if (email.length === 0) {
    return { data: null };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: "Email must be a valid address." };
  }

  return { data: email };
}

function validateIdentifier(identifierInput: unknown): IdentifierValidationResult {
  if (typeof identifierInput !== "string") {
    return { error: "Username or email is required." };
  }

  const identifier = identifierInput.trim().toLowerCase();
  const identifierType = identifier.includes("@") ? "email" : "username";

  if (identifierType === "email") {
    const email = validateEmail(identifier);

    if ("error" in email || email.data === null) {
      return { error: "Email must be a valid address." };
    }
  } else {
    const username = validateUsername(identifier);

    if ("error" in username) {
      return username;
    }
  }

  return { data: { identifier, identifierType } };
}

export function validateRegistrationInput(
  input: RegistrationInput,
): RegistrationValidationResult {
  const username = validateUsername(input.username);

  if ("error" in username) {
    return username;
  }

  const email = validateEmail(input.email);

  if ("error" in email) {
    return email;
  }

  const password = validatePassword(input.password, "Password", true);

  if ("error" in password) {
    return password;
  }

  return {
    data: {
      username: username.data,
      email: email.data,
      password: password.data,
    },
  };
}

export function validateLoginInput(input: LoginInput): LoginValidationResult {
  const identifier = validateIdentifier(input.identifier ?? input.username);

  if ("error" in identifier) {
    return identifier;
  }

  const password = validatePassword(input.password, "Password", false);

  if ("error" in password) {
    return password;
  }

  return {
    data: {
      ...identifier.data,
      password: password.data,
    },
  };
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

export function validateEmailChangeInput(
  input: EmailChangeInput,
): EmailChangeValidationResult {
  const email = validateEmail(input.email);

  if ("error" in email) {
    return email;
  }

  const currentPassword = validatePassword(
    input.currentPassword,
    "Current password",
    false,
  );

  if ("error" in currentPassword) {
    return { error: "Current password is invalid." };
  }

  return {
    data: {
      email: email.data,
      currentPassword: currentPassword.data,
    },
  };
}

export function validateRecoveryCodeChangeInput(
  input: RecoveryCodeChangeInput,
): RecoveryCodeChangeValidationResult {
  const currentPassword = validatePassword(
    input.currentPassword,
    "Current password",
    false,
  );

  if ("error" in currentPassword) {
    return { error: "Current password is invalid." };
  }

  return { data: { currentPassword: currentPassword.data } };
}

export function validatePasswordRecoveryInput(
  input: PasswordRecoveryInput,
): PasswordRecoveryValidationResult {
  const identifier = validateIdentifier(input.identifier);

  if ("error" in identifier) {
    return { error: "Recovery details are invalid." };
  }

  if (typeof input.recoveryCode !== "string") {
    return { error: "Recovery details are invalid." };
  }

  const recoveryCode = input.recoveryCode.trim();

  if (recoveryCode.length < 16 || recoveryCode.length > 32) {
    return { error: "Recovery details are invalid." };
  }

  const newPassword = validatePassword(
    input.newPassword,
    "New password",
    true,
  );

  if ("error" in newPassword) {
    return newPassword;
  }

  return {
    data: {
      ...identifier.data,
      recoveryCode,
      newPassword: newPassword.data,
    },
  };
}
