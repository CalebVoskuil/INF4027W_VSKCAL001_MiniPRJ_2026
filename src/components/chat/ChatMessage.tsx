"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Product } from "@/types";
import ChatProductCard from "./ChatProductCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

export default function ChatMessage({ role, content, products }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
          isUser ? "bg-foreground text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-white rounded-br-sm"
              : "bg-gray-100 text-gray-800 rounded-bl-sm"
          }`}
        >
          {content}
        </div>

        {/* Product Cards */}
        {products && products.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {products.map((product) => (
              <ChatProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
