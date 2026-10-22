export type RegistrationInput = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
};

export type RegistrationCredentials = {
  username: string;
  email: string | null;
  password: string;
};

export type LoginInput = {
  identifier?: unknown;
  username?: unknown;
  password?: unknown;
};

export type LoginCredentials = {
  identifier: string;
  identifierType: "email" | "username";
  password: string;
};

export type PasswordChangeInput = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

export type PasswordChangeCredentials = {
  currentPassword: string;
  newPassword: string;
};

export type RecoveryCodeChangeInput = {
  currentPassword?: unknown;
};

export type RecoveryCodeChangeCredentials = {
  currentPassword: string;
};

export type PasswordRecoveryInput = {
  identifier?: unknown;
  recoveryCode?: unknown;
  newPassword?: unknown;
};

export type PasswordRecoveryCredentials = {
  identifier: string;
  identifierType: "email" | "username";
  recoveryCode: string;
  newPassword: string;
};

export type EmailChangeInput = {
  email?: unknown;
  currentPassword?: unknown;
};

export type EmailChangeCredentials = {
  email: string | null;
  currentPassword: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  recoveryCodeHash: string | null;
};

export type AuthSession = {
  sessionId: string;
  user: AuthUser;
};

export type RegistrationValidationResult =
  | { data: RegistrationCredentials }
  | { error: string };

export type LoginValidationResult =
  | { data: LoginCredentials }
  | { error: string };

export type PasswordChangeValidationResult =
  | { data: PasswordChangeCredentials }
  | { error: string };

export type RecoveryCodeChangeValidationResult =
  | { data: RecoveryCodeChangeCredentials }
  | { error: string };

export type PasswordRecoveryValidationResult =
  | { data: PasswordRecoveryCredentials }
  | { error: string };

export type EmailChangeValidationResult =
  | { data: EmailChangeCredentials }
  | { error: string };
