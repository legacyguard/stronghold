"use client";
import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { useTranslation } from 'react-i18next';
const Toast = dynamic(() => import("../Toast"), { ssr: false });
import { supabase } from "@/lib/supabase";

function LoginPageContent() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  async function signInWithOAuth(provider: "google" | "apple") {
    setError(null);
    setInfo(null);
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/");
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("Magic link sent. Check your inbox.");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("Password reset email sent. Follow the link to set a new password.");
  }

  // Show toast message from query string (e.g., after sign out)
  const [initialized, setInitialized] = useState(false);
  if (!initialized && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("msg");
    if (msg) {
      setInfo(msg);
      const url = new URL(window.location.href);
      url.searchParams.delete("msg");
      window.history.replaceState({}, "", url);
    }
    setInitialized(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-lg bg-background">
      <Toast
        message={error || info}
        type={error ? "error" : info ? "success" : "info"}
        onClose={() => {
          setError(null);
          setInfo(null);
        }}
      />

      <div className="w-full max-w-md space-y-lg bg-surface rounded-xl shadow-xl p-2xl border border-border/20">
        {/* Logo and Header */}
        <div className="text-center space-y-md">
          <div className="flex justify-center">
            <div className="p-md bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-lg">
              <Shield className="h-8 w-8 text-surface" />
            </div>
          </div>
          <div>
            <h1 className="text-h2 text-text-dark font-semibold">{t('login.title')}</h1>
            <p className="text-body text-text-light">{t('login.subtitle')}</p>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-sm">
          <button
            onClick={() => signInWithOAuth("google")}
            className="w-full h-12 rounded-lg bg-text-dark text-surface hover:opacity-90 transition-opacity font-medium"
            disabled={loading}
          >
            {t('login.google_button')}
          </button>
          <button
            onClick={() => signInWithOAuth("apple")}
            className="w-full h-12 rounded-lg bg-text-dark text-surface hover:opacity-90 transition-opacity font-medium"
            disabled={loading}
          >
            {t('login.apple_button')}
          </button>
        </div>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/20"></div>
          </div>
          <span className="relative bg-surface px-md text-caption text-text-light">or</span>
        </div>

        {/* Email Login Form */}
        <form className="space-y-md" onSubmit={signInWithEmail}>
          <div>
            <label htmlFor="email" className="block text-body font-medium text-text-dark mb-xs">
              {t('login.email_label')}
            </label>
            <input
              id="email"
              type="email"
              placeholder={t('login.email_placeholder')}
              className="w-full h-12 rounded-lg border border-border/20 px-md bg-neutral-beige/50 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-body font-medium text-text-dark mb-xs">
              {t('login.password_label')}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t('login.password_placeholder')}
              className="w-full h-12 rounded-lg border border-border/20 px-md bg-neutral-beige/50 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-primary text-surface hover:bg-primary-light transition-colors font-medium shadow-lg"
            disabled={loading || !email || !password}
          >
            {loading ? t('login.signing_in') : t('login.sign_in_button')}
          </button>
        </form>

        {/* Additional Options */}
        <div className="space-y-sm">
          <button
            onClick={sendMagicLink}
            className="w-full h-12 rounded-lg border border-border/20 hover:bg-neutral-beige/50 transition-colors font-medium text-text-dark"
            disabled={loading || !email}
          >
            {t('login.magic_link_button')}
          </button>

          <button
            onClick={resetPassword}
            className="w-full h-12 rounded-lg border border-border/20 hover:bg-neutral-beige/50 transition-colors font-medium text-text-dark"
            disabled={loading || !email}
          >
            {t('login.forgot_password_button')}
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center pt-md border-t border-border/10">
          <p className="text-body text-text-light">
            {t('login.no_account')}&nbsp;
            <Link href="/signup" className="text-primary hover:underline font-medium">
              {t('login.create_account')}
            </Link>
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-md bg-red-50 border border-red-200 rounded-lg">
            <p className="text-body text-red-600">{error}</p>
          </div>
        )}
        {info && (
          <div className="p-md bg-green-50 border border-green-200 rounded-lg">
            <p className="text-body text-green-700">{info}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-lg bg-background">
      <div className="w-full max-w-md space-y-lg bg-surface rounded-xl shadow-xl p-2xl border border-border/20">
        <div className="text-center space-y-md">
          <div className="flex justify-center">
            <div className="p-md bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-lg">
              <Shield className="h-8 w-8 text-surface" />
            </div>
          </div>
          <div>
            <h1 className="text-h2 text-text-dark font-semibold">Načítava sa...</h1>
            <p className="text-body text-text-light">Príprava prihlásenia...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

