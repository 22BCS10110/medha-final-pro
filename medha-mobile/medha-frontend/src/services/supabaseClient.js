/**
 * Local auth adapter — replaces Supabase.
 * Provides the same interface so AuthContext doesn't break.
 * All auth is now handled via Django JWT backend.
 */

const listeners = [];

export const supabaseAuth = {
  signIn: async (email, password) => {
    // Handled by authAPI.login in api.js — this is a no-op shim
    return { session: null, user: null };
  },

  signUp: async (email, password) => {
    return { session: null, user: null };
  },

  signOut: async () => {
    localStorage.removeItem('medha_token');
    localStorage.removeItem('medha_refresh_token');
    localStorage.removeItem('medha_user');
    listeners.forEach(cb => cb('SIGNED_OUT', null));
  },

  getSession: async () => {
    const token = localStorage.getItem('medha_token');
    if (!token) return null;
    const user = JSON.parse(localStorage.getItem('medha_user') || 'null');
    return token ? { access_token: token, user } : null;
  },

  onAuthStateChange: (callback) => {
    listeners.push(callback);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },

  getAccessToken: async () => {
    return localStorage.getItem('medha_token');
  },
};

// No actual Supabase client needed
export const supabase = null;
