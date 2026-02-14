"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubscribed(true);
        setEmail("");
        toast.success("Successfully subscribed to the newsletter!");
      } else if (res.status === 409) {
        toast.info("You're already subscribed!");
        setSubscribed(true);
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Logo + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/">
              <h2 className="text-xl font-bold tracking-tight mb-3">
                TechNest<span className="text-gray-400">.</span>
              </h2>
            </Link>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">
              Your destination for premium smartphones. AI-powered search to find the perfect phone.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-sm h-10 max-w-[220px]"
                  disabled={subscribing}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={subscribing}
                  className="bg-foreground text-white hover:bg-gray-800 h-10 px-5 text-sm font-medium"
                >
                  {subscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  AI Search
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-foreground transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact Information</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                info@technest.co.za
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                +27 21 650 2100
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                UCT, Rondebosch, Cape Town, 7700
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods + Socials */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Payment Icons */}
          <div className="flex items-center gap-2">
            {["Visa", "MasterCard", "PayPal", "Apple Pay"].map((method) => (
              <span
                key={method}
                className="bg-gray-50 text-[11px] text-gray-500 font-medium px-3 py-1.5 rounded border border-gray-200"
              >
                {method}
              </span>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TechNest. All rights reserved. | INF4027W Mini Project 2026
        </div>
      </div>
    </footer>
  );
}
