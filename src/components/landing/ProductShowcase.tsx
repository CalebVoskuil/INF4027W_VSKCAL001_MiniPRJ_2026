"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductShowcaseProps {
  products: Product[];
  loading: boolean;
}

const headingChars = "Featured".split("");

const charReveal: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: (i: number) => ({
    y: "0%",
    opacity: 1,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 120,
      damping: 14,
    },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const linkVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.6, duration: 0.5 },
  },
};

export default function ProductShowcase({
  products,
  loading,
}: ProductShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading with character clip reveal */}
        <div className="flex items-end justify-between mb-12">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground overflow-hidden">
            {headingChars.map((char, i) => (
              <span key={i} className="inline-block overflow-hidden">
                <motion.span
                  className="inline-block"
                  variants={charReveal}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  custom={i}
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </h2>

          <motion.div
            variants={linkVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <Link
              href="/products?category=flagship"
              className="text-sm font-medium text-gray-500 hover:text-foreground transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                custom={i}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
