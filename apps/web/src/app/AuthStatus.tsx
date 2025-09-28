"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        setError(error.message);
      } else {
        setEmail(data.user?.email ?? null);
      }
      setLoading(false);
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    const url = new URL("/login", window.location.origin);
    url.searchParams.set("msg", "You have been signed out.");
    router.push(url.toString());
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading auth…</p>;
  }

  if (!email) {
    return (
      <div className="text-sm">
        <span className="text-gray-600">Not signed in.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-700">Signed in as {email}</span>
      <button
        onClick={signOut}
        className="rounded-md border px-3 h-8 hover:bg-gray-50"
      >
        Sign out
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}


