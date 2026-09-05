import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPasswordForEmail: async () => {},
  updatePassword: async () => {},
  updateAlertPreferences: async () => {},
  signOut: async () => {},
  isLoggedIn: false,
  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
  authError: null,
  setAuthError: () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check if URL hash or search params contains errors or recovery token
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    if (hash.includes('error=') || search.includes('error=')) {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
      const errDesc = params.get('error_description');
      const errCode = params.get('error_code');
      const err = params.get('error');

      if (err || errCode || errDesc) {
        const decoded = errDesc ? decodeURIComponent(errDesc.replace(/\+/g, ' ')) : 'Authentication link is invalid or has expired.';
        setAuthError(decoded);
        // Clean URL cleanly without triggering page reload
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setIsPasswordRecovery(true);
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password) => {
    const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/foliox/'}`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: baseUrl,
      },
    });
    if (error) throw error;
    return data;
  };

  const resetPasswordForEmail = async (email) => {
    const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/foliox/'}`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: baseUrl,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setIsPasswordRecovery(false);
    // Clear recovery hash from URL bar
    window.history.replaceState(null, '', window.location.pathname);
    return data;
  };

  const updateAlertPreferences = async (enabled) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { ipo_alerts_enabled: Boolean(enabled) },
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error);
    setSession(null);
    setUser(null);
    setIsPasswordRecovery(false);
  };

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    updatePassword,
    updateAlertPreferences,
    signOut,
    isLoggedIn: Boolean(session && user),
    isPasswordRecovery,
    setIsPasswordRecovery,
    authError,
    setAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
