export type AuthInput = {
  username?: unknown;
  password?: unknown;
};

export type AuthCredentials = {
  username: string;
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

export type AuthUser = {
  id: number;
  username: string;
};

export type AuthSession = {
  sessionId: string;
  user: AuthUser;
};

export type AuthValidationResult =
  | { data: AuthCredentials }
  | { error: string };

export type PasswordChangeValidationResult =
  | { data: PasswordChangeCredentials }
  | { error: string };
