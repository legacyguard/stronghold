"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // When the user comes from email, Supabase sets a recovery session.
    // Optionally, we could check session here.
  }, []);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setInfo("Password updated. Redirecting...");
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Set new password</h1>
        <form className="grid gap-3" onSubmit={updatePassword}>
          <input
            type="password"
            placeholder="New password"
            className="h-10 rounded-md border px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="h-10 rounded-md border px-3"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Update password
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
      </div>
    </div>
  );
}


