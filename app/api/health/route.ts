import { NextResponse } from "next/server";

export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      services: {
        removebg: {
          configured: !!process.env.REMOVEBG_API_KEY,
          status: process.env.REMOVEBG_API_KEY ? "ready" : "not_configured",
        },
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          status: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? "ready" : "not_configured",
        },
      },
    };

    const isHealthy = checks.services.removebg.configured && checks.services.supabase.configured;

    return NextResponse.json(checks, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

