import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { getRBACContext } from "./rbac";
import { authAPI } from "../services/api";
import { startSyncEngine, stopSyncEngine, updateSyncToken } from "../services/offlineService";

export const AuthContext = createContext();

// Push the JWT into the Electron main process so main-process requests
// (NFC patient lookup, sync engine) can attach the Bearer header too.
// In browser mode this is a no-op.
const syncTokenToMain = (token) => {
  try {
    window.medhaAPI?.setAuthToken?.(token ?? null);
  } catch {
    // ignore — renderer bridge might not be available in browser mode
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("medha_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Derive RBAC context from user
  const rbac = useMemo(() => getRBACContext(user), [user]);

  // Verify existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("medha_token");
      if (token) {
        syncTokenToMain(token);
        try {
          const res = await authAPI.me();
          const userData = res.data;
          setUser(userData);
          localStorage.setItem("medha_user", JSON.stringify(userData));
        } catch {
          // Token expired or invalid
          localStorage.removeItem("medha_token");
          localStorage.removeItem("medha_refresh_token");
          localStorage.removeItem("medha_user");
          syncTokenToMain(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();

    // Start offline sync engine if we have a token
    if (localStorage.getItem("medha_token")) {
      startSyncEngine().catch(() => {});
    }

    return () => { stopSyncEngine().catch(() => {}); };
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ username, password });
      const { tokens, user: userData } = res.data;
      localStorage.setItem("medha_token", tokens.access);
      localStorage.setItem("medha_refresh_token", tokens.refresh);
      localStorage.setItem("medha_user", JSON.stringify(userData));
      syncTokenToMain(tokens.access);
      setUser(userData);
      // Start sync engine after login
      startSyncEngine().catch(() => {});
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(credential);
      const { tokens, user: userData } = res.data;
      localStorage.setItem("medha_token", tokens.access);
      localStorage.setItem("medha_refresh_token", tokens.refresh);
      localStorage.setItem("medha_user", JSON.stringify(userData));
      syncTokenToMain(tokens.access);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = (userData) => {
    setUser(userData);
    localStorage.setItem("medha_user", JSON.stringify(userData));
  };

  const logout = async () => {
    // Stop sync engine on logout
    stopSyncEngine().catch(() => {});
    try {
      const refresh = localStorage.getItem("medha_refresh_token");
      await authAPI.logout(refresh);
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    localStorage.removeItem("medha_user");
    localStorage.removeItem("medha_token");
    localStorage.removeItem("medha_refresh_token");
    syncTokenToMain(null);
  };

  // Permission helper methods
  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);
  const canAccess = (feature) => user?.permissions?.[feature] === true;
  const isInHospital = (hospitalId) => {
    if (!user || !hospitalId) return false;
    if (user.role === 'super_admin') return true;
    return user.hospital_id === hospitalId;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      googleLogin,
      loginWithToken,
      logout,
      loading,
      setLoading,
      // RBAC helpers
      ...rbac,
      hasRole,
      hasAnyRole,
      canAccess,
      isInHospital,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
