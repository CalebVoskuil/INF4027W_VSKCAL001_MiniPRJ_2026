"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  ChevronRight,
  Home,
  Smartphone,
  Minus,
  Plus,
  Shield,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/types";
import { getProductById, getProducts, incrementProductViews } from "@/lib/firebase/firestore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { where, limit } from "firebase/firestore";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const p = await getProductById(id);
        setProduct(p);
        if (p) {
          incrementProductViews(id);
          // Fetch related products
          const related = await getProducts([
            where("category", "==", p.category),
            limit(5),
          ]);
          setRelatedProducts(related.filter((r) => r.id !== id).slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link href="/products" className="text-[#F85606] hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = () => {
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

  const specRows = [
    { label: "Brand", value: product.brand },
    { label: "Model", value: product.model },
    { label: "Display", value: product.specs.display },
    { label: "Processor", value: product.specs.processor },
    { label: "Memory", value: product.specs.ram },
    { label: "Storage", value: product.specs.storage },
    { label: "Camera", value: product.specs.camera },
    { label: "Battery", value: product.specs.battery },
    { label: "Operating System", value: product.specs.os },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#F85606] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-[#F85606]">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium line-clamp-1">
          {product.name}
        </span>
      </nav>

      {/* Product Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-8"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Smartphone className="w-32 h-32" />
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 border-2 rounded-lg overflow-hidden ${
                    selectedImage === i
                      ? "border-[#F85606]"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Badge variant="secondary" className="capitalize mb-2">
            {product.category === "midrange" ? "Mid-Range" : product.category}
          </Badge>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-sm text-gray-500 mb-4">Brand: {product.brand}</p>

          <p className="text-3xl font-bold text-[#F85606] mb-6">
            R{product.price.toLocaleString("en-ZA")}
          </p>

          {/* Key Specs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {specRows.slice(0, 6).map((row) => (
              <div key={row.label} className="text-sm">
                <span className="text-gray-500">{row.label}</span>
                <p className="font-medium">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          {/* Quantity & Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium border-x border-gray-300">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-[#F85606] hover:bg-[#E04E05] text-white"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              onClick={handleWishlistToggle}
              variant="outline"
              size="lg"
              className={inWishlist ? "text-[#F85606] border-[#F85606]" : ""}
            >
              <Heart
                className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`}
              />
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Truck className="w-5 h-5 text-[#F85606]" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Shield className="w-5 h-5 text-[#F85606]" />
              <span>Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <RotateCcw className="w-5 h-5 text-[#F85606]" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="specifications" className="mb-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specification</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <div className="prose max-w-none text-gray-600">
            <p>
              The {product.name} is a {product.category === "flagship" ? "premium" : product.category === "midrange" ? "versatile mid-range" : "affordable"}{" "}
              smartphone from {product.brand}, powered by the {product.specs.processor}. 
              It features a stunning {product.specs.display} display, {product.specs.camera} camera system, 
              and a {product.specs.battery} battery to keep you going all day. 
              With {product.specs.ram} of RAM and {product.specs.storage} of storage, 
              this device runs on {product.specs.os}.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="specifications" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            {specRows.map((row, i) => (
              <div
                key={row.label}
                className={`flex ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <span className="w-48 px-4 py-3 font-medium text-sm text-gray-600 border-r">
                  {row.label}
                </span>
                <span className="px-4 py-3 text-sm">{row.value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
