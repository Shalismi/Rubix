import { useEffect, useState } from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../api/authApi";
import type { AuthCredentials, AuthUser } from "../types";

function getMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) {
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setAuthError(getMessage(error));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function runAuthRequest(
    request: (credentials: AuthCredentials) => Promise<AuthUser>,
    credentials: AuthCredentials,
  ) {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const authenticatedUser = await request(credentials);
      setUser(authenticatedUser);
    } catch (error) {
      setAuthError(getMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function login(credentials: AuthCredentials) {
    return runAuthRequest(loginRequest, credentials);
  }

  function register(credentials: AuthCredentials) {
    return runAuthRequest(registerRequest, credentials);
  }

  async function logout() {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      await logoutRequest();
      setUser(null);
    } catch (error) {
      setAuthError(getMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    authError,
    isCheckingSession,
    isSubmitting,
    user,
    clearAuthError: () => setAuthError(null),
    login,
    logout,
    register,
  };
}
