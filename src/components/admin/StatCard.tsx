"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  format?: (n: number) => string;
  change: number; // percentage
  icon: LucideIcon;
  index: number;
}

function AnimatedNumber({
  value,
  prefix = "",
  format,
}: {
  value: number;
  prefix?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (latest) => {
    const formatted = format
      ? format(Math.round(latest))
      : Math.round(latest).toLocaleString();
    return `${prefix}${formatted}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>{prefix}0</span>;
}

export default function StatCard({
  title,
  value,
  prefix = "",
  format,
  change,
  icon: Icon,
  index,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const isPositive = change >= 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                <AnimatedNumber
                  value={value}
                  prefix={prefix}
                  format={format}
                />
              </p>
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: index * 0.1 + 0.8, duration: 0.4 }}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    isPositive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-400">This Month</span>
              </motion.div>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
