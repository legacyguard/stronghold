"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
const AuthStatus = dynamic(() => import("../AuthStatus"), { ssr: false });
const Toast = dynamic(() => import("../Toast"), { ssr: false });
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
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

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("Check your email to confirm your account.");
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <Toast
        message={error || info}
        type={error ? "error" : info ? "success" : "info"}
        onClose={() => {
          setError(null);
          setInfo(null);
        }}
      />
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <AuthStatus />

        <div className="grid gap-3">
          <button
            onClick={() => signInWithOAuth("google")}
            className="h-10 rounded-md bg-black text-white hover:opacity-90 transition"
            disabled={loading}
          >
            Continue with Google
          </button>
          <button
            onClick={() => signInWithOAuth("apple")}
            className="h-10 rounded-md bg-black text-white hover:opacity-90 transition"
            disabled={loading}
          >
            Continue with Apple
          </button>
        </div>

        <div className="relative text-center">
          <span className="px-2 text-sm text-gray-500">or</span>
        </div>

        <form className="grid gap-3" onSubmit={signInWithEmail}>
          <input
            type="email"
            placeholder="Email"
            className="h-10 rounded-md border px-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="h-10 rounded-md border px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={loading}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={signUpWithEmail}
              className="flex-1 h-10 rounded-md border hover:bg-gray-50 transition"
              disabled={loading}
            >
              Sign up
            </button>
          </div>
        </form>

        <div className="grid gap-2">
          <form className="grid gap-2" onSubmit={sendMagicLink}>
            <button
              type="submit"
              className="h-10 rounded-md border hover:bg-gray-50 transition"
              disabled={loading || !email}
            >
              Send magic link
            </button>
          </form>
          <form className="grid gap-2" onSubmit={resetPassword}>
            <button
              type="submit"
              className="h-10 rounded-md border hover:bg-gray-50 transition"
              disabled={loading || !email}
            >
              Forgot password
            </button>
          </form>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-green-700" role="status">
            {info}
          </p>
        )}
      </div>
    </div>
  );
}


