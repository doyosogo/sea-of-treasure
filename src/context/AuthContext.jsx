import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/auth.js";
import { useNotifications } from "./NotificationContext.jsx";

const ACCESS_TOKEN_KEY = "sot_access_token";
const REFRESH_TOKEN_KEY = "sot_refresh_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showInfo, showSuccess, showWarning } = useNotifications();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const result = await authService.getCurrentUser(accessToken);

        if (!cancelled) {
          setUser(result.user);
        }
      } catch {
        if (!cancelled) {
          showWarning("Session expired.");
        }
        clearSession();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  function storeSession(result) {
    localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    setUser(result.user);
    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }

  const refreshCurrentUser = useCallback(async () => {
    if (!accessToken) {
      return null;
    }

    const result = await authService.getCurrentUser(accessToken);
    setUser(result.user);
    return result.user;
  }, [accessToken]);

  async function login(credentials) {
    const result = await authService.login(credentials);
    storeSession(result);
    showSuccess("Logged in.");
    return result;
  }

  async function register(credentials) {
    const result = await authService.register(credentials);
    storeSession(result);
    showSuccess("Registration successful.");
    return result;
  }

  async function logout() {
    try {
      await authService.logout(refreshToken);
    } finally {
      clearSession();
      showInfo("Logged out.");
    }
  }

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    refreshCurrentUser
  }), [user, accessToken, loading, refreshToken, refreshCurrentUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
