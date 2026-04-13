"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthConfirmPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (!code) {
      router.replace("/auth/login?error=Missing+authorization+code");
      return;
    }

    const supabase = createClient();

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error("Code exchange failed:", error.message);
          router.replace(`/auth/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        router.replace(next);
      })
      .catch((err: unknown) => {
        console.error("Unexpected error during code exchange:", err);
        setError("Something went wrong. Please try signing in again.");
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">Sign-in failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/auth/login" className="btn-primary inline-block py-3 px-6 text-sm">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
        <div className="text-5xl mb-4 animate-spin">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">Completing sign-in...</h1>
        <p className="text-gray-500 text-sm">Please wait while we verify your account.</p>
      </div>
    </div>
  );
}
