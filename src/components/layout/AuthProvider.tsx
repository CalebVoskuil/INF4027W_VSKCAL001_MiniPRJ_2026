"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { onAuthChange, getUserData } from "@/lib/firebase/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setLoading } = useAuthStore();
  const { loadWishlist } = useWishlistStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        setUser(userData);
        if (userData) {
          loadWishlist(userData.uid);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, loadWishlist]);

  return <>{children}</>;
}
