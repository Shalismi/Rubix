export type AuthUser = {
  id: number;
  username: string;
};

export type AuthCredentials = {
  username: string;
  password: string;
};

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};
