import { Suspense } from "react";

import { AuthConfirmPageClient } from "./page-client";

function AuthConfirmFallback() {
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

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthConfirmFallback />}>
      <AuthConfirmPageClient />
    </Suspense>
  );
}
