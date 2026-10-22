import {
  apiRequest,
  ApiRequestError,
} from "../../../shared/api/apiRequest";
import type {
  AuthUser,
  EmailChangeInput,
  LoginCredentials,
  PasswordChangeInput,
  PasswordRecoveryInput,
  RecoveryCodeChangeInput,
  RegistrationCredentials,
} from "../types";

type AuthResponse = {
  user: AuthUser;
};

type RegistrationResponse = AuthResponse & {
  recoveryCode: string;
};

type RecoveryCodeResponse = AuthResponse & {
  recoveryCode: string;
};

type PasswordRecoveryResponse = {
  message: string;
  recoveryCode: string;
};

type EmailVerificationRequestResponse = {
  message: string;
  developmentVerificationUrl?: string;
};

type MessageResponse = {
  message: string;
};

export async function getCurrentUser() {
  try {
    const data = await apiRequest<AuthResponse>("/api/auth/me");
    return data.user;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function register(credentials: RegistrationCredentials) {
  return apiRequest<RegistrationResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function login(credentials: LoginCredentials) {
  const data = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function logout() {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function changePassword(passwords: PasswordChangeInput) {
  await apiRequest<void>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(passwords),
  });
}

export async function changeEmail(input: EmailChangeInput) {
  const data = await apiRequest<AuthResponse>("/api/auth/email", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.user;
}

export function requestEmailVerification() {
  return apiRequest<EmailVerificationRequestResponse>(
    "/api/auth/email/verification",
    { method: "POST" },
  );
}

export function verifyEmail(token: string) {
  return apiRequest<MessageResponse>("/api/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function replaceRecoveryCode(input: RecoveryCodeChangeInput) {
  return apiRequest<RecoveryCodeResponse>("/api/auth/recovery-code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function recoverPassword(input: PasswordRecoveryInput) {
  return apiRequest<PasswordRecoveryResponse>("/api/auth/password/recover", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
