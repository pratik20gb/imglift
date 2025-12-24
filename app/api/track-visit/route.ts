import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    
    // Get IP address from request headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";
    
    // Get user ID if authenticated
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
        // Ignore auth errors, just track by IP
      }
    }

    // Check if we already tracked this visit today (to avoid duplicates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingVisit } = await supabase
      .from("site_visits")
      .select("id")
      .eq("ip", ip)
      .gte("created_at", today.toISOString())
      .limit(1)
      .single();

    // Only insert if no visit today for this IP (or if user is logged in, check by user_id)
    if (!existingVisit) {
      const { error } = await supabase
        .from("site_visits")
        .insert({
          user_id: userId,
          ip: ip,
        });

      if (error && process.env.NODE_ENV === "development") {
        console.error("Error tracking visit:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Silently fail - don't break the user experience
    if (process.env.NODE_ENV === "development") {
      console.error("Track visit error:", err);
    }
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

