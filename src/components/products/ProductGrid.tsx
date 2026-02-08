"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import QuickViewModal from "./QuickViewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductGridProps {
  products: Product[];
  totalCount?: number;
}

export default function ProductGrid({ products, totalCount }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("default");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "bestselling":
        return b.salesCount - a.salesCount;
      case "newest":
        return 0; // Would sort by createdAt
      default:
        return 0;
    }
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">{products.length}</span>
          {totalCount && totalCount > products.length
            ? ` of ${totalCount}`
            : ""}{" "}
          results
        </p>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
              <SelectItem value="bestselling">Best Selling</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-coral text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-coral text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or search criteria
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
