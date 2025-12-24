"use client";

import { useEffect, useState } from "react";
import { Sparkles, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type HealthResponse = {
  status?: string;
  services?: {
    removebg?: { configured: boolean; status: string };
    supabase?: { configured: boolean; status: string };
  };
};

type StatsResponse = {
  totalRemovals?: number;
  totalVisitors?: number;
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [healthRes, statsRes] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/stats"),
        ]);

        if (healthRes.ok) {
          setHealth(await healthRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const removeBgOk = health?.services?.removebg?.configured;
  const supabaseOk = health?.services?.supabase?.configured;
  const allOk = removeBgOk && supabaseOk;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-3 sm:px-4 lg:px-6 py-6">
      <div className="w-full max-w-3xl">
        <Card className="border-border/60 shadow-lg backdrop-blur-sm bg-card/95">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Deployment status
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Quick snapshot of API health and usage for your imglift deployment.
                </CardDescription>
              </div>
              <Sparkles className="hidden sm:block h-6 w-6 text-primary/70" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall status */}
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm">
              {allOk ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {loading
                    ? "Checking services..."
                    : allOk
                    ? "All core services are configured."
                    : "One or more services need attention."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Remove.bg and Supabase configuration are required for full functionality.
                </p>
              </div>
            </div>

            {/* Services grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm">
                <p className="font-medium mb-1.5">Remove.bg API</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {removeBgOk ? "API key is configured." : "API key missing or misconfigured."}
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Check `REMOVEBG_API_KEY` in your deployment environment.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm">
                <p className="font-medium mb-1.5">Supabase</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {supabaseOk ? "Client keys are configured." : "Supabase URL/keys missing or invalid."}
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-3 text-sm">
              <p className="font-medium mb-2">Usage snapshot</p>
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground">Backgrounds removed</p>
                  <p className="font-semibold">
                    {stats?.totalRemovals?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Visitors</p>
                  <p className="font-semibold">
                    {stats?.totalVisitors?.toLocaleString() ?? "0"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


