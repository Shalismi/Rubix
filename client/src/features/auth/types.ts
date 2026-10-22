export type AuthUser = {
  id: number;
  username: string;
  email: string | null;
  emailVerified: boolean;
  hasRecoveryCode: boolean;
};

export type LoginCredentials = {
  identifier: string;
  password: string;
};

export type RegistrationCredentials = {
  username: string;
  email?: string;
  password: string;
};

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};

export type EmailChangeInput = {
  email: string | null;
  currentPassword: string;
};

export type RecoveryCodeChangeInput = {
  currentPassword: string;
};

export type PasswordRecoveryInput = {
  identifier: string;
  recoveryCode: string;
  newPassword: string;
};
