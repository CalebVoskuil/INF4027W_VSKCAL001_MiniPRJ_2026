"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from "@/components/products/ProductGrid";
import FilterSidebar from "@/components/products/FilterSidebar";
import { Product } from "@/types";
import { getProducts } from "@/lib/firebase/firestore";
import { where, QueryConstraint } from "firebase/firestore";

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const constraints: QueryConstraint[] = [];
        const category = searchParams.get("category");
        if (category) {
          constraints.push(where("category", "==", category));
        }

        const brandsParam = searchParams.get("brands");
        if (brandsParam) {
          const brands = brandsParam.split(",").filter(Boolean);
          if (brands.length > 0 && brands.length <= 30) {
            constraints.push(where("brand", "in", brands));
          }
        }

        let results = await getProducts(constraints);

        // Client-side filtering for price, RAM, storage
        const minPrice = parseInt(searchParams.get("minPrice") ?? "0");
        const maxPrice = parseInt(searchParams.get("maxPrice") ?? "999999");
        const ramFilter = searchParams.get("ram")?.split(",").filter(Boolean);
        const storageFilter = searchParams.get("storage")?.split(",").filter(Boolean);

        results = results.filter((p) => {
          if (p.price < minPrice || p.price > maxPrice) return false;
          if (ramFilter?.length && !ramFilter.includes(p.specs.ram)) return false;
          if (storageFilter?.length && !storageFilter.includes(p.specs.storage))
            return false;
          return p.isActive !== false;
        });

        setProducts(results);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Products</span>
        {searchParams.get("category") && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium capitalize">
              {searchParams.get("category") === "midrange"
                ? "Mid-Range"
                : searchParams.get("category")}
            </span>
          </>
        )}
      </nav>

      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 bg-white border border-gray-200 rounded-lg p-4">
            <FilterSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <div className="mt-6">
                  <FilterSidebar
                    onMobileClose={() => setMobileFilterOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
