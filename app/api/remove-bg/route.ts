import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const FREE_REMOVAL_LIMIT = 2;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided", code: "MISSING_IMAGE" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith("image/") || !ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed", code: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    // Validate file size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Image too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      console.error("REMOVEBG_API_KEY is not configured");
      return NextResponse.json(
        { error: "Service configuration error", code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    // Identify user or IP for free-tier limits
    const supabase = createServerClient();

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (user && !authError) {
        userId = user.id;
      } else if (authError && process.env.NODE_ENV === "development") {
        console.error("Auth error in remove-bg limit check:", authError);
      }
    }

    const ipHeader =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";
    const ip =
      ipHeader.split(",")[0]?.trim() ||
      "unknown";

    // Enforce free tier limit: 2 removals per user/IP total (until payments are added)
    try {
      const filter = userId ? { user_id: userId } : { ip };

      const { count, error: usageError } = await supabase
        .from("removal_usage")
        .select("*", { count: "exact", head: true })
        .match(filter);

      if (usageError && process.env.NODE_ENV === "development") {
        console.error("Error checking removal usage:", usageError);
      }

      if (count !== null && count >= FREE_REMOVAL_LIMIT) {
        return NextResponse.json(
          {
            error:
              "You have reached the free limit of 2 background removals. Please subscribe to continue.",
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    } catch (usageCheckError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected error during usage limit check:", usageCheckError);
      }
      // If usage check fails, we still proceed to avoid blocking all users.
    }

    // Prepare request to Remove.bg API
    const removeBgForm = new FormData();
    removeBgForm.append("image_file", image);
    removeBgForm.append("size", "auto");

    const startTime = Date.now();
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: removeBgForm,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to remove background";
      let errorCode = "REMOVEBG_API_ERROR";

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.errors?.[0]?.title ||
          errorJson.error?.message ||
          errorJson.error ||
          errorMessage;
        errorCode = errorJson.errors?.[0]?.code || errorCode;
      } catch {
        // If response is not JSON, use the text
        errorMessage = errorText || errorMessage;
      }

      console.error("Remove.bg API error:", {
        status: response.status,
        error: errorMessage,
        duration,
      });

      // Map HTTP status codes to appropriate client errors
      const statusCode = response.status >= 400 && response.status < 500 ? response.status : 500;
      
      return NextResponse.json(
        { error: errorMessage, code: errorCode },
        { status: statusCode }
      );
    }

    const buffer = await response.arrayBuffer();

    console.log("Background removal successful:", {
      fileSize: image.size,
      duration: `${duration}ms`,
    });

    // Record successful removal usage for this user/IP
    try {
      await supabase.from("removal_usage").insert({
        user_id: userId,
        ip,
      });
    } catch (insertError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to record removal usage:", insertError);
      }
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Background removal error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "Background removal failed. Please try again.", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
}
