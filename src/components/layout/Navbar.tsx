"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  LayoutDashboard,
  Heart,
  Package,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { signOut } from "@/lib/firebase/auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/products?category=flagship", label: "Flagship" },
  { href: "/products?category=midrange", label: "Mid-Range" },
  { href: "/products?category=budget", label: "Budget" },
];

export default function Navbar() {
  const { user } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Avoid hydration mismatch: cart data comes from localStorage
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const totalItems = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Don't show nav chrome on admin pages
  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="shrink-0">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Tech</span>
            <span className="text-foreground">Nest</span>
            <span className="text-gray-400">.</span>
          </h1>
        </Link>

        {/* Center: Nav Links (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === link.href
                  ? "text-foreground bg-gray-100"
                  : "text-gray-500 hover:text-foreground hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Icons + Auth */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/search"
            className="p-2 text-gray-500 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="p-2 text-gray-500 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="p-2 text-gray-500 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-foreground text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-gray-500 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors">
                  <User className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <DropdownMenuSeparator />
                {user.role === "admin" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/dashboard")}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  <Package className="w-4 h-4 mr-2" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/wishlist")}>
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="bg-foreground text-white hover:bg-gray-800 rounded-full px-5 text-sm font-medium"
              >
                Sign Up
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === link.href
                    ? "text-foreground bg-gray-100"
                    : "text-gray-500 hover:text-foreground hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
