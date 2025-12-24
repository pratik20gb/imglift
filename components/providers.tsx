"use client";

import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/loading-screen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LoadingScreen />
      {children}
      <Toaster />
    </AuthProvider>
  );
}

