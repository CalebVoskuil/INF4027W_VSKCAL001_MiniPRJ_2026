"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { getProducts } from "@/lib/firebase/firestore";
import { where, limit } from "firebase/firestore";
import HeroSection from "@/components/landing/HeroSection";
import BrandMarquee from "@/components/landing/BrandMarquee";
import ProductShowcase from "@/components/landing/ProductShowcase";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const featured = await getProducts([
          where("category", "==", "flagship"),
          limit(4),
        ]);
        setFeaturedProducts(featured);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        try {
          const all = await getProducts([]);
          setFeaturedProducts(
            all.filter((p) => p.category === "flagship").slice(0, 4)
          );
        } catch {
          // Firebase may not be configured yet
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div>
      <HeroSection />
      <BrandMarquee />
      <ProductShowcase products={featuredProducts} loading={loading} />
    </div>
  );
}
