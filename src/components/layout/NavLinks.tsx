"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, TrendingUp, Sparkles, Menu } from "lucide-react";
import { useState } from "react";

const mainLinks = [
  { href: "/products", label: "All Products" },
  { href: "/products?category=budget", label: "Budget" },
  { href: "/products?category=midrange", label: "Mid-Range" },
  { href: "/products?category=flagship", label: "Flagship" },
];

const promoLinks = [
  { href: "/products?sort=salesCount", label: "Best Seller", icon: TrendingUp },
  { href: "/products?sort=newest", label: "New Arrival", icon: Sparkles },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="bg-[#F85606] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Mobile menu button */}
          <button
            className="sm:hidden flex items-center"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Main links */}
          <div className="hidden sm:flex items-center gap-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1 text-sm font-medium hover:bg-white/20 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Promo links */}
          <div className="flex items-center gap-1">
            <Link
              href="/products?sale=true"
              className="px-3 py-1 text-sm font-medium hover:bg-white/20 rounded transition-colors flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" />
              HOT DEALS
            </Link>
            {promoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden md:flex px-3 py-1 text-sm font-medium hover:bg-white/20 rounded transition-colors items-center gap-1"
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="sm:hidden pb-3 space-y-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium hover:bg-white/20 rounded transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
