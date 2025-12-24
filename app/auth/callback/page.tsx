"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth errors
        if (error || errorDescription) {
          console.error("OAuth error:", error || errorDescription);
          router.push(`/auth?error=${encodeURIComponent(errorDescription || error || "Authentication failed")}`);
          return;
        }

        // Lazy-load supabase client on the client only
        const { supabase } = await import("@/lib/supabase");

        // If code is present, exchange it for session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            router.push(`/auth?error=${encodeURIComponent(exchangeError.message)}`);
            return;
          }

          if (data.session) {
            router.push("/");
            return;
          }
        }

        // No code - check if session already exists (Supabase might have set it)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push("/");
          return;
        }

        // No code and no session - redirect to auth with error
        console.error("No code and no session found");
        router.push("/auth?error=No authorization code received. Please configure redirect URL in Supabase: http://localhost:3000/auth/callback");
      } catch (err) {
        console.error("Callback handler error:", err);
        router.push("/auth?error=Authentication failed");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Completing authentication...</p>
          </div>
        </div>
      }
    >
      <CallbackPageInner />
    </Suspense>
  );
}

