import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { supabaseAuth } from "../services/supabaseClient";
import { getRBACContext } from "./rbac";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("medha_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Derive RBAC context from user
  const rbac = useMemo(() => getRBACContext(user), [user]);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await supabaseAuth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'patient',
            hospital_id: session.user.user_metadata?.hospital_id || null,
            permissions: session.user.user_metadata?.permissions || {},
          };
          setUser(userData);
          localStorage.setItem("medha_user", JSON.stringify(userData));
          // Store token for API calls
          if (session.access_token) {
            localStorage.setItem("medha_token", session.access_token);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'patient',
          hospital_id: session.user.user_metadata?.hospital_id || null,
          permissions: session.user.user_metadata?.permissions || {},
        };
        setUser(userData);
        localStorage.setItem("medha_user", JSON.stringify(userData));
        if (session.access_token) {
          localStorage.setItem("medha_token", session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem("medha_user");
        localStorage.removeItem("medha_token");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { session } = await supabaseAuth.signIn(email, password);
      if (session?.access_token) {
        localStorage.setItem("medha_token", session.access_token);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = (userData) => {
    setUser(userData);
    localStorage.setItem("medha_user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    localStorage.removeItem("medha_user");
    localStorage.removeItem("medha_token");
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