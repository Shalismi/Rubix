import type {
  AuthCredentials,
  AuthUser,
  PasswordChangeInput,
} from "../types";

const API_BASE_URL = "http://localhost:5000";

type AuthResponse = {
  user: AuthUser;
};

async function getErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: unknown;
  } | null;

  return typeof body?.message === "string"
    ? body.message
    : "Something went wrong. Please try again.";
}

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as AuthResponse;

  return data.user;
}

export async function register(credentials: AuthCredentials) {
  const data = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function login(credentials: AuthCredentials) {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function logout() {
  await request<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function changePassword(passwords: PasswordChangeInput) {
  await request<void>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(passwords),
  });
}
