"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  BarChart3,
  LogOut,
} from "lucide-react";
import AuthGuard from "@/components/layout/AuthGuard";
import { signOut } from "@/lib/firebase/auth";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <AuthGuard requireAdmin>
      <div className="flex min-h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shrink-0 hidden md:flex md:flex-col">
          <div className="p-4">
            <h2 className="font-bold text-lg text-foreground">Admin Panel</h2>
          </div>
          <nav className="space-y-1 px-2 flex-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-foreground font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-foreground"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-2 pb-4 mt-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <nav className="flex justify-around">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center py-2 px-3 text-xs ${
                    isActive ? "text-foreground font-semibold" : "text-gray-400"
                  }`}
                >
                  <link.icon className="w-5 h-5 mb-1" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
