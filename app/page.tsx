"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Cloud,
  Copy,
  Check,
  User,
  LogOut,
  LogIn,
  History,
  X,
  Github,
  Star,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Page() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [original, setOriginal] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [totalRemovals, setTotalRemovals] = useState<number | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);
  const [userCredits, setUserCredits] = useState<{ used: number; remaining: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Track visit on page load
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers["authorization"] = `Bearer ${session.access_token}`;
        }
        
        await fetch("/api/track-visit", {
          method: "POST",
          headers,
        });
      } catch (err) {
        // Silently fail - don't break user experience
      }
    };

    trackVisit();
  }, []);

  // Fetch stats on page load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setTotalRemovals(data.totalRemovals ?? 0);
        setTotalVisitors(data.totalVisitors ?? 0);
      } catch (err) {
        // Silently fail
      }
    };

    fetchStats();
  }, []);

  // Fetch user credits when logged in
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) {
        setUserCredits(null);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/user-credits", {
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserCredits(data);
        }
      } catch (err) {
        // Silently fail
      }
    };

    fetchUserCredits();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
    toast.success("Signed out successfully");
  };

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return "Please upload an image file";
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return "Image too large. Maximum size is 5MB";
    }

    return null;
  };

  const handleUpload = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setOriginalFile(file);
    setOriginal(URL.createObjectURL(file));
    setProcessed(null);
    setProcessedBlob(null);
    setError(null);
    setSavedUrl(null);
    setCopied(false);
    toast.success("Image uploaded successfully");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const resetImage = () => {
    setOriginal(null);
    setOriginalFile(null);
    setProcessed(null);
    setProcessedBlob(null);
    setError(null);
    setSavedUrl(null);
    setCopied(false);
  };

  // Fetch fun stats (total backgrounds removed)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.totalRemovals === "number") {
          setTotalRemovals(data.totalRemovals);
        }
      } catch {
        // Silent fail; stats are non-critical
      }
    };

    fetchStats();
  }, []);

  const saveToCloud = async () => {
    if (!processedBlob) {
      toast.error("No processed image to save");
      return;
    }

    if (!user) {
      toast.error("Please sign in to save images to cloud");
      router.push("/auth");
      return;
    }

    setSaving(true);
    setError(null);

    const toastId = toast.loading("Saving image to cloud...");

    try {
      const formData = new FormData();
      formData.append("image", processedBlob, `imglift-${Date.now()}.png`);
      
      // Get auth token if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/save-image", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save image");
      }

      if (data.url) {
        setSavedUrl(data.url);
        
        // Show warning if history wasn't saved
        if (data.warning || data.dbError) {
          toast.warning(data.warning || "Image saved but history not recorded", { id: toastId });
        } else {
          toast.success("Image saved to cloud successfully!", { id: toastId });
        }
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save image";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!savedUrl) return;
    
    try {
      await navigator.clipboard.writeText(savedUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
      setError("Failed to copy link");
    }
  };

  const removeBackground = async () => {
    if (!originalFile) return;

    // Check if user is signed in
    if (!user) {
      toast.error("Please sign in to remove backgrounds");
      router.push("/auth");
      return;
    }

    setLoading(true);
    setError(null);
    const toastId = toast.loading("Removing background...");

    try {
      const formData = new FormData();
      formData.append("image", originalFile);

      // Include auth header if user is signed in so backend can enforce per-user limits
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();

        // Special handling for free limit reached
        if (data?.code === "LIMIT_REACHED") {
          toast.error(data.error || "Free limit reached", { id: toastId });
          setError(data.error || "Free limit reached");
          return;
        }

        throw new Error(data.error || "Failed to remove background");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setProcessed(url);
      setProcessedBlob(blob);
      setSavedUrl(null);
      toast.success("Background removed successfully!", { id: toastId });
      
      // Update stats after successful removal
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      setTotalRemovals(statsData.totalRemovals ?? 0);
      setTotalVisitors(statsData.totalVisitors ?? 0);

      // Update user credits if logged in
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const creditsRes = await fetch("/api/user-credits", {
            headers: {
              authorization: `Bearer ${session.access_token}`,
            },
          });
          if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            setUserCredits(creditsData);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
      setProcessed(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-background to-muted flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Secondary Pattern Layer */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, currentColor 49%, currentColor 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, currentColor 49%, currentColor 51%, transparent 52%)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* LEFT HALF: Main Canvas - Upload/Download Feature */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <Card className="border-border/60 shadow-lg backdrop-blur-sm bg-card/95">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                {/* Upload Section */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all min-h-[280px] sm:min-h-[360px] bg-card/80 ${
                    isDragging
                      ? "border-primary/80 bg-primary/5 shadow-lg"
                      : "border-border/70 hover:shadow-md hover:border-primary/70"
                  }`}
                >
                  {!original ? (
                    <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
                      <Upload className={`h-12 w-12 sm:h-14 sm:w-14 transition-colors ${
                        isDragging ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`} />
                      <span className="text-sm sm:text-base text-muted-foreground hover:text-foreground text-center px-2">
                        {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          e.target.files && handleUpload(e.target.files[0])
                        }
                      />
                    </label>
                  ) : (
                    <>
                      <div className="relative w-full mb-4">
                        <img
                          src={original}
                          alt="Original image"
                          className="rounded-xl max-h-48 sm:max-h-64 lg:max-h-72 w-full object-contain shadow-md"
                        />
                        <Button
                          onClick={resetImage}
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="sm"
                      >
                        Change image
                      </Button>
                    </>
                  )}
                </div>

                {/* Result Section */}
                <div className="border border-border/70 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center bg-card/80 min-h-[280px] sm:min-h-[360px]">
                  {processed ? (
                    <>
                      <img
                        src={processed}
                        alt="Processed image with background removed"
                        className="rounded-xl max-h-48 sm:max-h-64 lg:max-h-72 w-full object-contain mb-4 shadow-md bg-background"
                      />
                      <div className="flex flex-col gap-2 w-full items-center">
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <a
                              href={processed}
                              download="no-bg.png"
                            >
                              Download PNG
                            </a>
                          </Button>
                          <Button
                            onClick={saveToCloud}
                            variant="default"
                            size="sm"
                            disabled={saving || !!savedUrl}
                            className="w-full sm:w-auto"
                          >
                            <Cloud className="h-4 w-4 mr-2" />
                            {saving ? "Saving..." : savedUrl ? "Saved!" : "Save to Cloud"}
                          </Button>
                        </div>
                        {savedUrl && (
                          <div className="w-full mt-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                            <input
                              type="text"
                              value={savedUrl}
                              readOnly
                              className="flex-1 text-xs bg-background px-2 py-1 rounded border border-border text-foreground"
                            />
                            <Button
                              onClick={copyToClipboard}
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              aria-label="Copy link"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                      <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-center px-2">Processed image will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
                  {error}
                </div>
              )}

              {/* Remove Background Button */}
              <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3">
                {!user && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please sign in to remove backgrounds
                  </p>
                )}
                <Button
                  size="lg"
                  onClick={removeBackground}
                  disabled={!original || loading || !user}
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? "Processing..." : "Remove Background"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RIGHT HALF: Sidebar - Auth, Socials, Stats */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col p-4 sm:p-6 lg:p-8 relative z-10 border-t lg:border-t-0 lg:border-l border-border/30 bg-background/50 backdrop-blur-sm overflow-y-auto">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Brand Title */}
          <div className="space-y-2">
            <CardTitle className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent inline-block pb-0.5">
                imglift
              </span>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Free, ultra-clean background removal with a modern, minimal UI.
            </CardDescription>
          </div>

          {/* Stats Box */}
          {(totalRemovals !== null || totalVisitors !== null) && (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left space-y-0.5">
                <p className="font-semibold leading-tight text-sm">
                  {totalRemovals?.toLocaleString() ?? "0"} backgrounds zapped
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {totalVisitors?.toLocaleString() ?? "0"} visitors • Join the cleanup
                </p>
              </div>
            </div>
          )}

          {/* Social & Support Section */}
          <div className="space-y-4">
            {/* Call to Action */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                Love this tool? ⭐
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reviews and feedback are greatly appreciated! If you found this helpful, consider giving it a star on GitHub.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant="default"
                className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 group"
              >
                <a
                  href="https://github.com/pratik20gb/bg-remover"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Star className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 fill-current" />
                  <span>Star on GitHub</span>
                </a>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
              >
                <a
                  href="https://github.com/sponsors/pratik20gb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Heart className="h-4 w-4 group-hover:scale-110 transition-transform duration-200 text-primary" />
                  <span>Sponsor Project</span>
                </a>
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                aria-label="GitHub"
              >
                <a
                  href="https://github.com/pratik20gb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <Github className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                aria-label="X (Twitter)"
              >
                <a
                  href="https://x.com/shori_pratik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </a>
              </Button>
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex flex-col gap-3">
            {!authLoading && (
              user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/80">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">
                      {user.email}
                    </span>
                  </div>

                  {/* Credits Display */}
                  {userCredits !== null && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 shadow-xs">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-primary">
                          {userCredits.remaining} credit{userCredits.remaining !== 1 ? "s" : ""} left
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userCredits.used}/{userCredits.total} used
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => router.push("/history")}
                      variant="outline"
                      className="w-full"
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => router.push("/auth")}
                  variant="default"
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
