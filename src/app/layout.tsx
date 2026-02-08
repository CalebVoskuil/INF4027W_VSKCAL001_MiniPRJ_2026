import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/layout/AuthProvider";
import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import NavLinks from "@/components/layout/NavLinks";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

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
            <TopBar />
            <Navbar />
            <NavLinks />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
