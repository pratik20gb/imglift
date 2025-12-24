"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome as GoogleIcon } from "lucide-react";

function AuthForm() {
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);
  const { signInWithProvider } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error in URL (from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setSocialLoading(true);
    
    try {
      const { error } = await signInWithProvider("google");
      if (error) {
        setError(error.message || "Failed to sign in with Google");
        setSocialLoading(false);
      }
      // If successful, user will be redirected to callback URL
    } catch (err) {
      setError("Failed to sign in with Google");
      setSocialLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Secondary Pattern Layer */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, currentColor 49%, currentColor 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, currentColor 49%, currentColor 51%, transparent 52%)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      <Card className="w-full max-w-md mx-4 relative z-10">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block" style={{ lineHeight: '1.2', paddingBottom: '0.1em' }}>
              imglift
            </span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Google OAuth Button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={socialLoading}
            >
              <GoogleIcon className="h-5 w-5 mr-2" />
              {socialLoading ? "Connecting..." : "Continue with Google"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing, you agree to sign in with your Google account
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    }>
      <AuthForm />
    </Suspense>
  );
}

