"use client";

import { create } from "zustand";
import { getWishlist, updateWishlist } from "@/lib/firebase/firestore";

interface WishlistStore {
  items: string[];
  loaded: boolean;
  addItem: (productId: string, userId?: string) => void;
  removeItem: (productId: string, userId?: string) => void;
  isInWishlist: (productId: string) => boolean;
  loadWishlist: (userId: string) => Promise<void>;
  setItems: (items: string[]) => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],
  loaded: false,

  addItem: async (productId: string, userId?: string) => {
    const newItems = [...get().items, productId];
    set({ items: newItems });
    if (userId) {
      await updateWishlist(userId, newItems);
    }
  },

  removeItem: async (productId: string, userId?: string) => {
    const newItems = get().items.filter((id) => id !== productId);
    set({ items: newItems });
    if (userId) {
      await updateWishlist(userId, newItems);
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.includes(productId);
  },

  loadWishlist: async (userId: string) => {
    const wishlist = await getWishlist(userId);
    set({ items: wishlist?.productIds ?? [], loaded: true });
  },

  setItems: (items: string[]) => set({ items }),
}));
