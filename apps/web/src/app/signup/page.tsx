"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
const Toast = dynamic(() => import("../Toast"), { ssr: false });
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const _router = useRouter(); // For future redirect functionality

  async function signInWithOAuth(provider: "google" | "apple") {
    setError(null);
    setInfo(null);
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined
      }
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo("Check your email to confirm your account before signing in.");
    }
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
            <h1 className="text-h2 text-text-dark font-semibold">Create Account</h1>
            <p className="text-body text-text-light">Join LegacyGuard to protect your family's future</p>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-sm">
          <button
            onClick={() => signInWithOAuth("google")}
            className="w-full h-12 rounded-lg bg-text-dark text-surface hover:opacity-90 transition-opacity font-medium"
            disabled={loading}
          >
            Continue with Google
          </button>
          <button
            onClick={() => signInWithOAuth("apple")}
            className="w-full h-12 rounded-lg bg-text-dark text-surface hover:opacity-90 transition-opacity font-medium"
            disabled={loading}
          >
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/20"></div>
          </div>
          <span className="relative bg-surface px-md text-caption text-text-light">or</span>
        </div>

        {/* Email Signup Form */}
        <form className="space-y-md" onSubmit={signUpWithEmail}>
          <div>
            <label htmlFor="email" className="block text-body font-medium text-text-dark mb-xs">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full h-12 rounded-lg border border-border/20 px-md bg-neutral-beige/50 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-body font-medium text-text-dark mb-xs">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              className="w-full h-12 rounded-lg border border-border/20 px-md bg-neutral-beige/50 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-body font-medium text-text-dark mb-xs">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="w-full h-12 rounded-lg border border-border/20 px-md bg-neutral-beige/50 text-body placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-primary text-surface hover:bg-primary-light transition-colors font-medium shadow-lg"
            disabled={loading || !email || !password || !confirmPassword}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Terms and Privacy */}
        <p className="text-caption text-text-light text-center">
          By creating an account, you agree to our&nbsp;
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>

        {/* Sign In Link */}
        <div className="text-center pt-md border-t border-border/10">
          <p className="text-body text-text-light">
            Already have an account?&nbsp;
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
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