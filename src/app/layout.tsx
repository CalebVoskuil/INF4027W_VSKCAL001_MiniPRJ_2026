import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/layout/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChatAssistant from "@/components/chat/ChatAssistant";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechNest - Premium Mobile Phone Store",
  description:
    "Discover the perfect smartphone with AI-powered search. Browse flagship, mid-range, and budget phones from top brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider>
        <div className="flex flex-col min-h-screen">
  <Suspense fallback={null}>
    <Navbar />
  </Suspense>
  <main className="flex-1">{children}</main>
  <Footer />
</div>
          <Toaster position="top-right" richColors />
          <ChatAssistant />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
