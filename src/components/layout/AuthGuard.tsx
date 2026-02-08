"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
}: AuthGuardProps) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push("/login");
      }
      if (requireAdmin && user?.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, loading, requireAuth, requireAdmin, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (requireAdmin && user?.role !== "admin") return null;

  return <>{children}</>;
}
