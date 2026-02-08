"use client";

import Image from "next/image";
import { ShoppingCart, Heart, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const addItem = useCartStore((s) => s.addItem);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
    onClose();
  };

  const specRows = [
    { label: "Brand", value: product.brand },
    { label: "Model", value: product.model },
    { label: "Display", value: product.specs.display },
    { label: "Processor", value: product.specs.processor },
    { label: "RAM", value: product.specs.ram },
    { label: "Storage", value: product.specs.storage },
    { label: "Camera", value: product.specs.camera },
    { label: "Battery", value: product.specs.battery },
    { label: "OS", value: product.specs.os },
  ];

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image */}
          <div className="relative aspect-square bg-gray-50 rounded-lg">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Smartphone className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {product.category === "midrange" ? "Mid-Range" : product.category}
              </Badge>
              <span className="text-sm text-gray-500">{product.brand}</span>
            </div>

            <p className="text-3xl font-bold text-coral mb-4">
              R{formatPrice(product.price)}
            </p>

            <Separator className="my-4" />

            {/* Specs Table */}
            <div className="space-y-2">
              {specRows.map((row) => (
                <div key={row.label} className="flex text-sm">
                  <span className="w-24 text-gray-500 shrink-0">
                    {row.label}
                  </span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4">
                {product.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-coral hover:bg-coral-dark text-white"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
