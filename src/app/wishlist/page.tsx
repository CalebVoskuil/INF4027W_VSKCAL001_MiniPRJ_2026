"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import ProductCard from "@/components/products/ProductCard";
import { useWishlistStore } from "@/store/wishlistStore";
import { getProductsByIds } from "@/lib/firebase/firestore";
import { Product } from "@/types";

export default function WishlistPage() {
  const { items } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const data = await getProductsByIds(items);
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch wishlist products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [items]);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#F85606]/10 rounded-lg">
            <Heart className="w-6 h-6 text-[#F85606]" />
          </div>
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <span className="text-sm text-gray-500">({items.length} items)</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-4">
              Save items you love by clicking the heart icon on products.
            </p>
            <Link href="/products">
              <button className="px-6 py-2 bg-[#F85606] text-white rounded-md hover:bg-[#E04E05]">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
