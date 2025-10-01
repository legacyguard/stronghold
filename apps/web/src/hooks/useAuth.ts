"use client";

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authHelpers } from '@/lib/auth';

export interface ExtendedAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): ExtendedAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Get initial session and user
    const getInitialSession = async () => {
      try {
        setError(null);
        const { data: { session }, error } = await authHelpers.getCurrentSession();

        if (!isMounted) return;

        if (error) {
          setError(error.message);
          setUser(null);
          setSession(null);
        } else {
          setUser(session?.user || null);
          setSession(session);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUser(null);
        setSession(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen to auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange((user) => {
      if (isMounted) {
        setUser(user);
        setLoading(false);
        setError(null);
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, error };
}

// Specific auth action hooks
export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async <T>(action: () => Promise<{ error: Error | null; data?: T }>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await action();
      if (result.error) {
        setError(result.error.message);
        return { success: false, error: result.error.message };
      }
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    return executeAction(() => authHelpers.signInWithOAuth(provider) as Promise<{ error: Error | null }>);
  };

  const signInWithPassword = async (email: string, password: string) => {
    return executeAction(() => authHelpers.signInWithPassword(email, password) as Promise<{ error: Error | null }>);
  };

  const signUp = async (email: string, password: string) => {
    return executeAction(() => authHelpers.signUp(email, password));
  };

  const sendMagicLink = async (email: string) => {
    return executeAction(() => authHelpers.sendMagicLink(email));
  };

  const resetPassword = async (email: string) => {
    return executeAction(() => authHelpers.resetPassword(email));
  };

  const signOut = async () => {
    return executeAction(() => authHelpers.signOut());
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    clearError,
    signInWithOAuth,
    signInWithPassword,
    signUp,
    sendMagicLink,
    resetPassword,
    signOut
  };
}