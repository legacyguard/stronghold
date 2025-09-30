import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

// Client-side Supabase client
export const supabaseClient = createClientComponentClient();

// Auth helper types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// OAuth providers
export type OAuthProvider = 'google' | 'apple';

// Auth helper functions
export const authHelpers = {
  // Sign in with OAuth
  async signInWithOAuth(provider: OAuthProvider) {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    return await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
  },

  // Sign in with email and password
  async signInWithPassword(email: string, password: string) {
    return await supabaseClient.auth.signInWithPassword({ email, password });
  },

  // Sign up with email and password
  async signUp(email: string, password: string) {
    const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    return await supabaseClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo }
    });
  },

  // Send magic link
  async sendMagicLink(email: string) {
    const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    return await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo }
    });
  },

  // Reset password
  async resetPassword(email: string) {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    return await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  },

  // Sign out
  async signOut() {
    return await supabaseClient.auth.signOut();
  },

  // Get current user
  async getCurrentUser() {
    return await supabaseClient.auth.getUser();
  },

  // Get current session
  async getCurrentSession() {
    return await supabaseClient.auth.getSession();
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabaseClient.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }
};

// URL handling utilities
export const urlHelpers = {
  // Get redirect URL from query params
  getRedirectUrl() {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "/";
  },

  // Get message from URL and clean it
  getAndClearMessage() {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("msg");
    if (msg) {
      const url = new URL(window.location.href);
      url.searchParams.delete("msg");
      window.history.replaceState({}, "", url);
    }
    return msg;
  },

  // Create auth redirect URL
  createAuthRedirect(path: string, message?: string) {
    const url = new URL(path, window.location.origin);
    if (message) {
      url.searchParams.set("msg", message);
    }
    return url.toString();
  }
};

// Form validation utilities
export const validationHelpers = {
  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters" };
    }
    if (password.length > 72) {
      return { valid: false, message: "Password must be less than 72 characters" };
    }
    return { valid: true };
  },

  // Check if passwords match
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
};

// User display utilities
export const userHelpers = {
  // Get display name from user
  getDisplayName(user: User | null): string {
    if (!user) return 'User';
    return user.user_metadata?.full_name ||
           user.user_metadata?.name ||
           user.email?.split('@')[0] ||
           'User';
  },

  // Get user avatar URL
  getAvatarUrl(user: User | null): string | null {
    if (!user) return null;
    return user.user_metadata?.avatar_url ||
           user.user_metadata?.picture ||
           null;
  },

  // Check if user email is verified
  isEmailVerified(user: User | null): boolean {
    return user?.email_confirmed_at !== undefined;
  }
};