import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "imglift - Remove Image Backgrounds Instantly",
  description: "Free, ultra-clean background removal tool. Remove image backgrounds instantly with AI-powered precision. Modern, minimal UI built with Next.js and Supabase.",
  keywords: ["background removal", "remove background", "image editor", "AI background removal", "free background remover"],
  authors: [{ name: "Pratik Raj" }],
  creator: "Pratik Raj",
  publisher: "Pratik Raj",
  metadataBase: new URL("https://imglift.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "imglift - Remove Image Backgrounds Instantly",
    description: "Free, ultra-clean background removal tool. Remove image backgrounds instantly with AI-powered precision.",
    url: "https://imglift.online",
    siteName: "imglift",
    images: [
      {
        url: "https://imglift.online/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "imglift - Background Removal Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "imglift - Remove Image Backgrounds Instantly",
    description: "Free, ultra-clean background removal tool. Remove image backgrounds instantly with AI-powered precision.",
    images: ["https://imglift.online/og-image.jpg"],
    creator: "@sage_pratik",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
