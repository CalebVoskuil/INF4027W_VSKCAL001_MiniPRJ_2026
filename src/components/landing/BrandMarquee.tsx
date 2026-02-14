"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const BRANDS = [
  "Samsung",
  "Apple",
  "Xiaomi",
  "Google",
  "OnePlus",
  "Nothing",
  "Realme",
  "Tecno",
];

function MarqueeRow({ direction = "left" }: { direction?: "left" | "right" }) {
  return (
    <div
      className="flex items-center gap-12 whitespace-nowrap group"
      style={{
        animation: `marquee-${direction} 30s linear infinite`,
      }}
    >
      {[...BRANDS, ...BRANDS].map((brand, i) => (
        <Link
          key={`${brand}-${i}`}
          href={`/products?brands=${brand}`}
          className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-gray-300 hover:text-foreground transition-colors duration-300 shrink-0"
        >
          {brand}
        </Link>
      ))}
    </div>
  );
}

export default function BrandMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      className="py-16 border-y border-gray-100 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Gradient edge masks */}
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-linear-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-linear-to-l from-white to-transparent" />

        <div className="marquee-hover-slow flex flex-col gap-6">
          <MarqueeRow direction="left" />
        </div>
      </div>
    </motion.section>
  );
}
