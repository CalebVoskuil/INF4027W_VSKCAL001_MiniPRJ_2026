"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingCart,
  User,
  Search,
  Camera,
  LogOut,
  LayoutDashboard,
  Heart,
  Package,
  ChevronDown,
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

export default function Navbar() {
  const { user } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <h1 className="text-2xl font-bold">
            <span className="text-[#F85606]">Tech</span>
            <span className="text-[#1A1A1A]">Nest</span>
            <span className="text-[#F85606]">.</span>
          </h1>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl flex items-center"
        >
          <div className="flex w-full border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[#F85606] focus-within:border-[#F85606]">
            <input
              type="text"
              placeholder="Search with AI... (e.g. 'Android phone under R15k with good camera')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <Link
              href="/search?mode=image"
              className="px-3 flex items-center border-l border-gray-300 hover:bg-gray-50 transition-colors"
              title="Search by image"
            >
              <Camera className="w-4 h-4 text-gray-500" />
            </Link>
            <button
              type="submit"
              className="px-4 bg-[#F85606] text-white hover:bg-[#E04E05] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Cart */}
        <Link
          href="/cart"
          className="flex items-center gap-2 hover:text-[#F85606] transition-colors"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#F85606] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <div className="hidden sm:block text-sm">
            <div className="text-xs text-gray-500">Cart</div>
            <div className="font-semibold">
              R{getTotalPrice().toLocaleString()}
            </div>
          </div>
        </Link>

        {/* User Account */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:text-[#F85606]"
              >
                <User className="w-5 h-5" />
                <div className="hidden sm:block text-left text-sm">
                  <div className="text-xs text-gray-500">Welcome</div>
                  <div className="font-semibold flex items-center gap-1">
                    {user.firstName}
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user.role === "admin" && (
                <>
                  <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
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
          <Link
            href="/login"
            className="flex items-center gap-2 hover:text-[#F85606] transition-colors"
          >
            <User className="w-5 h-5" />
            <div className="hidden sm:block text-sm">
              <div className="text-xs text-gray-500">Login</div>
              <div className="font-semibold">Account</div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
