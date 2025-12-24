import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.redirect("https://imglift.online");
    }

    const supabase = createServerClient();

    // Look up the short URL
    const { data, error } = await supabase
      .from("short_urls")
      .select("original_url")
      .eq("short_id", id)
      .single();

    if (error || !data) {
      // Redirect to home if not found
      return NextResponse.redirect("https://imglift.online");
    }

    // Redirect to the original Supabase URL
    return NextResponse.redirect(data.original_url);
  } catch (err) {
    console.error("Short URL redirect error:", err);
    return NextResponse.redirect("https://imglift.online");
  }
}

