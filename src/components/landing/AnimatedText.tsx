"use client";

import { motion, Variants } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

const containerVariants: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: {
      staggerChildren: 0.04,
      delayChildren: delay,
    },
  }),
};

const charVariants: Variants = {
  hidden: {
    y: "100%",
    opacity: 0,
    rotateX: -90,
  },
  visible: {
    y: "0%",
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
      mass: 0.8,
    },
  },
};

export default function AnimatedText({
  text,
  className = "",
  delay = 0,
  as: Tag = "h1",
}: AnimatedTextProps) {
  // Split into words to preserve natural wrapping
  const words = text.split(" ");

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      aria-label={text}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em]">
          {word.split("").map((char, charIndex) => (
            <span
              key={charIndex}
              className="inline-block overflow-hidden"
              style={{ perspective: "500px" }}
            >
              <motion.span
                className="inline-block"
                variants={charVariants}
              >
                {char}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.div>
  );
}
