import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Supabase is not configured. Please check your environment variables." },
        { status: 500 }
      );
    }

    // Check if service role key is available (needed to bypass RLS)
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasServiceRoleKey && process.env.NODE_ENV === "development") {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set - using anon key. RLS policies may block database inserts.");
    }

    // Get auth token from headers
    const authHeader = req.headers.get("authorization");
    const supabase = createServerClient();
    
    // If user is authenticated, verify the session
    let authenticatedUserId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (user && !authError) {
          authenticatedUserId = user.id;
        } else if (authError && process.env.NODE_ENV === "development") {
          console.error("Auth error:", authError);
        }
      } catch (authErr) {
        console.error("Error verifying user token:", authErr);
      }
    }

    // Generate unique filename (include user ID if authenticated)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const userPrefix = authenticatedUserId ? `${authenticatedUserId.slice(0, 8)}-` : "";
    const fileName = image.name 
      ? `imglift-${userPrefix}${timestamp}-${randomId}-${image.name}`
      : `imglift-${userPrefix}${timestamp}-${randomId}.png`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("processed-images")
      .upload(fileName, buffer, {
        contentType: image.type || "image/png",
        upsert: false,
      });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Supabase storage error:", error);
      }
      return NextResponse.json(
        { error: `Storage error: ${error.message || "Failed to upload image to storage"}`, code: "STORAGE_ERROR" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("processed-images")
      .getPublicUrl(data.path);

    // Create short URL
    const shortId = Math.random().toString(36).substring(2, 10);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://imglift.online";
    const shortUrl = `${baseUrl}/i/${shortId}`;

    // Save short URL mapping to database
    try {
      await supabase.from("short_urls").insert({
        short_id: shortId,
        original_url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      });
    } catch (shortUrlError) {
      // If short URL creation fails, log but continue
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create short URL:", shortUrlError);
      }
    }

    // Save metadata to database
    // Use service role key to bypass RLS for server-side operations
    const insertData = {
      user_id: authenticatedUserId,
      original_filename: image.name || null,
      processed_url: urlData.publicUrl,
      storage_path: data.path,
      file_size: image.size,
    };

    const { error: dbError, data: dbData } = await supabase
      .from("image_history")
      .insert(insertData)
      .select();

    if (dbError) {
      // Log error details in development
      if (process.env.NODE_ENV === "development") {
        console.error("Database insert error:", {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
        });
      }
      
      // Check if it's a permission/RLS error
      if (dbError.code === "42501" || dbError.message?.includes("permission") || dbError.message?.includes("policy")) {
        return NextResponse.json({
          success: true,
          url: shortUrl,
          originalUrl: urlData.publicUrl,
          path: data.path,
          warning: "Image saved to storage, but history not saved. Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file to enable history tracking.",
          dbError: "RLS policy blocked insert. Service role key required.",
        });
      }
      
      // Return error but still return the URL since storage upload succeeded
      return NextResponse.json({
        success: true,
        url: shortUrl,
        originalUrl: urlData.publicUrl,
        path: data.path,
        warning: "Image saved but history not recorded: " + (dbError.message || "Unknown error"),
        dbError: dbError.message,
      });
    }

    return NextResponse.json({
      success: true,
      url: shortUrl,
      originalUrl: urlData.publicUrl,
      path: data.path,
      historyId: dbData?.[0]?.id,
    });
  } catch (err) {
    console.error("Save image error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to save image";
    return NextResponse.json(
      { error: errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

