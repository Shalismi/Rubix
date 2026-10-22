import { useEffect, useState } from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../api/authApi";
import type {
  AuthUser,
  LoginCredentials,
  RegistrationCredentials,
} from "../types";

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
  const [registrationRecoveryCode, setRegistrationRecoveryCode] = useState<
    string | null
  >(null);

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

  async function login(credentials: LoginCredentials) {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const authenticatedUser = await loginRequest(credentials);
      setRegistrationRecoveryCode(null);
      setUser(authenticatedUser);
    } catch (error) {
      setAuthError(getMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(credentials: RegistrationCredentials) {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await registerRequest(credentials);
      setRegistrationRecoveryCode(result.recoveryCode);
      setUser(result.user);
    } catch (error) {
      setAuthError(getMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      await logoutRequest();
      setRegistrationRecoveryCode(null);
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
    registrationRecoveryCode,
    user,
    clearAuthError: () => setAuthError(null),
    dismissRegistrationRecoveryCode: () =>
      setRegistrationRecoveryCode(null),
    login,
    logout,
    register,
    updateUser: setUser,
  };
}
