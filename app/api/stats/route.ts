import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createServerClient();

    // Count total successful background removals
    const { count: removalsCount, error: removalsError } = await supabase
      .from("removal_usage")
      .select("*", { count: "exact", head: true });

    // Count unique visitors (distinct IPs or user_ids)
    const { count: visitorsCount, error: visitorsError } = await supabase
      .from("site_visits")
      .select("*", { count: "exact", head: true });

    if (removalsError || visitorsError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching stats:", removalsError || visitorsError);
      }
      return NextResponse.json(
        { totalRemovals: removalsCount ?? 0, totalVisitors: visitorsCount ?? 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        totalRemovals: removalsCount ?? 0,
        totalVisitors: visitorsCount ?? 0
      },
      { status: 200 }
    );
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stats API error:", err);
    }
    return NextResponse.json(
      { totalRemovals: 0, totalVisitors: 0 },
      { status: 200 }
    );
  }
}


