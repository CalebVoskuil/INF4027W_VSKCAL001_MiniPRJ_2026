"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingCart, Cpu, Battery, Camera, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils/format";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to add to wishlist");
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product.id, user.uid);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product.id, user.uid);
      toast.success("Added to wishlist");
    }
  };

  const categoryColors = {
    budget: "bg-green-100 text-green-700",
    midrange: "bg-blue-100 text-blue-700",
    flagship: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 p-4">
        <Link href={`/products/${product.id}`}>
          <div className="relative w-full h-full">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Smartphone className="w-16 h-16" />
              </div>
            )}
          </div>
        </Link>

        {/* Category Badge */}
        <Badge
          className={`absolute top-2 left-2 text-[10px] ${categoryColors[product.category]}`}
          variant="secondary"
        >
          {product.category === "midrange" ? "Mid-Range" : product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </Badge>

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleWishlistToggle}
            className={`p-1.5 rounded-full shadow-md transition-colors ${
              inWishlist
                ? "bg-coral text-white"
                : "bg-white text-gray-600 hover:bg-coral hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className="p-1.5 rounded-full bg-white text-gray-600 shadow-md hover:bg-coral hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-coral transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-lg font-bold text-coral mb-3">
          R{formatPrice(product.price)}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-gray-400" />
            <span>{product.specs.ram} / {product.specs.storage}</span>
          </div>
          <div className="flex items-center gap-1">
            <Battery className="w-3 h-3 text-gray-400" />
            <span>{product.specs.battery}</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-gray-400" />
            <span>{product.specs.camera.split("+")[0].trim()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-gray-400" />
            <span>{product.specs.display.split("\"")[0]}&quot;</span>
          </div>
        </div>

        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          className="w-full bg-coral hover:bg-coral-dark text-white text-sm"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
