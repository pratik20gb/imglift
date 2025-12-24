"use client";

import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Wait for page to fully load
    const handleLoad = () => {
      setIsFading(true);
      // Wait for fade animation to complete
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Match fade duration
    };

    // Check if page is already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      // Fallback: hide after 2 seconds max
      const timeout = setTimeout(handleLoad, 2000);
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(timeout);
      };
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-background to-muted flex items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{ pointerEvents: isFading ? "none" : "auto" }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)
          `,
          backgroundSize: "32px 32px",
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
          backgroundSize: "64px 64px",
        }}
      />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Pulsing imglift text */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-[1.15]">
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent inline-block pb-0.5 animate-pulse">
            imglift
          </span>
        </h1>

        {/* Loading dots */}
        <div className="flex items-center gap-2 mt-8">
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

