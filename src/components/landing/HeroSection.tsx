"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedText from "./AnimatedText";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax: scale down and fade out as user scrolls past
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated grain / noise background */}
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Subtle radial gradient accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gray-100/60 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        style={{ scale, opacity, y }}
      >
        {/* Main headline */}
        <AnimatedText
          text="Find Your"
          className="text-[clamp(3rem,8vw,8rem)] font-black leading-[0.9] tracking-tight text-foreground"
          delay={0.2}
        />
        <AnimatedText
          text="Next Phone"
          className="text-[clamp(3rem,8vw,8rem)] font-black leading-[0.9] tracking-tight text-foreground"
          delay={0.6}
        />

        {/* Subtitle with blur reveal */}
        <motion.p
          className="mt-8 text-lg md:text-xl text-gray-500 max-w-md mx-auto"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
        >
          Powered by AI. Curated for you.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
        >
          <Link href="/products">
            <Button
              size="lg"
              className="bg-foreground hover:bg-gray-800 text-white rounded-full px-8 text-base font-medium"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/search">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base font-medium border-gray-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Search
            </Button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.6 }}
        >
          <motion.div
            className="w-5 h-8 border-2 border-gray-300 rounded-full flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div className="w-1 h-1.5 bg-gray-400 rounded-full mt-1.5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
