import {
  apiRequest,
  ApiRequestError,
} from "../../../shared/api/apiRequest";
import type {
  AuthCredentials,
  AuthUser,
  PasswordChangeInput,
} from "../types";

type AuthResponse = {
  user: AuthUser;
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

export async function register(credentials: AuthCredentials) {
  const data = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function login(credentials: AuthCredentials) {
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
