import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const FREE_REMOVAL_LIMIT = 2;

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    
    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Count how many removals this user has made
    const { count, error } = await supabase
      .from("removal_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching user credits:", error);
      }
      return NextResponse.json(
        { used: 0, remaining: FREE_REMOVAL_LIMIT, total: FREE_REMOVAL_LIMIT },
        { status: 200 }
      );
    }

    const used = count ?? 0;
    const remaining = Math.max(0, FREE_REMOVAL_LIMIT - used);

    return NextResponse.json({
      used,
      remaining,
      total: FREE_REMOVAL_LIMIT,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("User credits API error:", err);
    }
    return NextResponse.json(
      { error: "Failed to fetch credits", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

