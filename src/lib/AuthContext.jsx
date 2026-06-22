import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
    
    // Listen to Supabase auth state changes — wrapped in try/catch to prevent
    // white-screen crash if Supabase client is misconfigured or env vars missing
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'EMAIL_CONFIRMED' || event === 'USER_UPDATED') {
          if (session?.user) {
            loadUserProfile(session.user);
          }
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.error('[AuthContext] onAuthStateChange failed:', err);
    }

    return () => {
      try { subscription?.unsubscribe(); } catch {}
    };
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      } else {
        // No profile yet — create stub. Mark as onboarded=false only if truly new
        // (created_at within last 60s). Older accounts without a profile row get
        // onboarded:true so they skip onboarding and land on dashboard.
        const createdAt = authUser.created_at ? new Date(authUser.created_at) : null;
        const isNewAccount = createdAt && (Date.now() - createdAt.getTime()) < 60_000;
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          role: authUser.user_metadata?.role || 'user',
          referred_by: authUser.user_metadata?.referred_by || null,
          onboarded: !isNewAccount, // returning users skip onboarding
        };
        // Upsert so duplicate calls don't fail
        supabase.from('User').upsert(newProfile).then(() => {});
        setUser(newProfile);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Profile load failed:', err);
      // Still set basic user from auth
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        role: authUser.user_metadata?.role || 'user',
      });
      setIsAuthenticated(true);
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Check if user has an active Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      // No session = normal unauthenticated state, NOT an error
      // Don't set authError here — auth routes (/login, /register) need to render freely
      
      // App public settings — we can store these in a Supabase table or hardcode
      // For now, set a basic config (can be moved to a Settings table later)
      setAppPublicSettings({
        id: 'app',
        public_settings: {
          app_name: 'Brandfletch Media',
          requires_auth: true,
        }
      });
      
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Failed to load app'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
