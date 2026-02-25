"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface ChatProductCardProps {
  product: Product;
}

export default function ChatProductCard({ product }: ChatProductCardProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specsLine = [
    product.specs.storage,
    product.specs.ram ? `${product.specs.ram} RAM` : null,
    product.specs.battery ? `${product.specs.battery} battery` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2.5 mt-1.5"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden shrink-0">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.id}`}
          className="text-xs font-semibold text-foreground hover:underline truncate block"
        >
          {product.name}
        </Link>
        <p className="text-[10px] text-gray-400 truncate">{specsLine}</p>
        <p className="text-xs font-bold text-foreground mt-0.5">
          R{product.price.toLocaleString()}
        </p>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        disabled={added}
        className={`shrink-0 p-1.5 rounded-md transition-colors ${
          added
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {added ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <ShoppingCart className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.div>
  );
}
