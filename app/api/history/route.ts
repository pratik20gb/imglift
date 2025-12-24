import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 500 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    const supabase = createServerClient();
    
    // Verify user is authenticated
    let authenticatedUserId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user && !authError) {
        authenticatedUserId = user.id;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Fetch user's image history with pagination
    const { data, error } = await supabase
      .from("image_history")
      .select("*", { count: "exact" })
      .eq("user_id", authenticatedUserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Database query error:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch image history", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images: data || [],
      pagination: {
        page,
        limit,
        hasMore: (data?.length || 0) === limit,
      },
    });
  } catch (err) {
    console.error("History API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch image history", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    const supabase = createServerClient();
    
    // Verify user is authenticated
    let authenticatedUserId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user && !authError) {
        authenticatedUserId = user.id;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get image record to verify ownership and get storage path
    const { data: imageData, error: fetchError } = await supabase
      .from("image_history")
      .select("storage_path, user_id")
      .eq("id", imageId)
      .single();

    if (fetchError || !imageData) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (imageData.user_id !== authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("processed-images")
      .remove([imageData.storage_path]);

    if (storageError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Storage delete error:", storageError);
      }
      // Continue to delete from DB even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("image_history")
      .delete()
      .eq("id", imageId)
      .eq("user_id", authenticatedUserId);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (err) {
    console.error("Delete API error:", err);
    return NextResponse.json(
      { error: "Failed to delete image", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

