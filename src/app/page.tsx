"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Truck,
  RefreshCcw,
  Headphones,
  Smartphone,
  Crown,
  Wallet,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/types";
import { getProducts } from "@/lib/firebase/firestore";
import { where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const BRANDS = ["Samsung", "Apple", "Xiaomi", "Google", "OnePlus"];

const CATEGORIES = [
  {
    name: "Flagship",
    value: "flagship",
    icon: Crown,
    description: "Premium performance",
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Mid-Range",
    value: "midrange",
    icon: Star,
    description: "Best value",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Budget",
    value: "budget",
    icon: Wallet,
    description: "Affordable choices",
    color: "bg-green-100 text-green-600",
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const [featured, sellers] = await Promise.all([
          getProducts([where("category", "==", "flagship"), limit(5)]),
          getProducts([orderBy("salesCount", "desc"), limit(5)]),
        ]);
        setFeaturedProducts(featured);
        setBestSellers(sellers);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // If index not ready, just fetch all
        try {
          const all = await getProducts([]);
          setFeaturedProducts(all.filter((p) => p.category === "flagship").slice(0, 5));
          setBestSellers(all.slice(0, 5));
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
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[#F85606] font-medium mb-2">
                Welcome to TechNest
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 leading-tight">
                Elevate Your Tech{" "}
                <span className="text-[#F85606]">Gadget Game</span>
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                Shop the latest technology available here at TechNest. 
                Use our AI-powered search to find the perfect phone for you.
              </p>
              <div className="flex gap-3">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="bg-[#F85606] hover:bg-[#E04E05] text-white"
                  >
                    Shop Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline">
                    AI Search
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 bg-[#F85606]/10 rounded-full flex items-center justify-center">
                  <Smartphone className="w-32 h-32 md:w-40 md:h-40 text-[#F85606]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Headphones, label: "24/7 Support", desc: "Customer service available" },
            { icon: Shield, label: "Secure", desc: "Certified marketplace" },
            { icon: Truck, label: "Free Shipping", desc: "On all orders" },
            { icon: RefreshCcw, label: "Easy Returns", desc: "Hassle-free returns" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-3">
              <div className="p-2 bg-[#F85606]/10 rounded-lg">
                <badge.icon className="w-5 h-5 text-[#F85606]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{badge.label}</p>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Logos */}
      <section className="py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {BRANDS.map((brand) => (
            <Link
              key={brand}
              href={`/products?brands=${brand}`}
              className="text-gray-400 hover:text-gray-900 transition-colors font-bold text-lg md:text-xl"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/products?category=${cat.value}`}
                className="group border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg hover:border-[#F85606] transition-all"
              >
                <div
                  className={`w-16 h-16 rounded-full ${cat.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  <cat.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link
              href="/products?category=flagship"
              className="text-[#F85606] hover:underline text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#F85606] to-[#E04E05] text-white rounded-lg p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="font-bold text-lg mb-1">Free Shipping</h3>
              <p className="text-sm text-white/80">On all orders nationwide</p>
            </div>
            <Link href="/products">
              <Button
                variant="secondary"
                size="sm"
                className="w-fit mt-4"
              >
                Shop Now
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-lg p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="font-bold text-lg mb-1">Premium Collection</h3>
              <p className="text-sm text-white/80">
                Explore flagship phones from top brands
              </p>
            </div>
            <Link href="/products?category=flagship">
              <Button
                variant="secondary"
                size="sm"
                className="w-fit mt-4"
              >
                Explore
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="font-bold text-lg mb-1">AI-Powered Search</h3>
              <p className="text-sm text-white/80">
                Find your perfect phone with AI
              </p>
            </div>
            <Link href="/search">
              <Button
                variant="secondary"
                size="sm"
                className="w-fit mt-4"
              >
                Try Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Best Sellers</h2>
            <Link
              href="/products?sort=bestselling"
              className="text-[#F85606] hover:underline text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
