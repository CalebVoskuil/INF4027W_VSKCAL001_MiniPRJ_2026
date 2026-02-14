"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useSpring,
  useTransform,
  useInView,
} from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBreakdown } from "@/lib/utils/analytics";

interface PerformanceRingProps {
  data: OrderStatusBreakdown;
}

function AnimatedCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(0, { stiffness: 40, damping: 18 });
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsub = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return <span ref={ref}>0</span>;
}

const RADIUS = 80;
const STROKE = 16;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SEGMENTS = [
  { key: "completed", label: "Completed", color: "#1A1A1A" },
  { key: "pending", label: "Pending", color: "#D1D5DB" },
] as const;

export default function PerformanceRing({ data }: PerformanceRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const total = data.total || 1; // avoid divide by zero
  const completedFraction = data.completed / total;
  const pendingFraction = data.pending / total;

  // Compute dash arrays
  const completedDash = completedFraction * CIRCUMFERENCE;
  const pendingDash = pendingFraction * CIRCUMFERENCE;
  const completedOffset = 0;
  const pendingOffset = -completedDash; // starts where completed ends

  return (
    <Card ref={ref}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Analytical Performance</CardTitle>
        <p className="text-xs text-gray-400">Your order performance data</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="transform -rotate-90"
            >
              {/* Background track */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#F3F4F6"
                strokeWidth={STROKE}
              />

              {/* Pending segment (behind completed) */}
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={SEGMENTS[1].color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${pendingDash} ${CIRCUMFERENCE}`}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={
                  isInView
                    ? { strokeDashoffset: pendingOffset }
                    : { strokeDashoffset: CIRCUMFERENCE }
                }
                transition={{
                  duration: 1.2,
                  delay: 0.6,
                  ease: "easeOut",
                }}
              />

              {/* Completed segment */}
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={SEGMENTS[0].color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${completedDash} ${CIRCUMFERENCE}`}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={
                  isInView
                    ? { strokeDashoffset: completedOffset }
                    : { strokeDashoffset: CIRCUMFERENCE }
                }
                transition={{
                  duration: 1,
                  delay: 0.3,
                  ease: "easeOut",
                }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                <AnimatedCount value={data.total} />
              </span>
              <span className="text-xs text-gray-400">Orders</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-4">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <span className="w-3 h-3 rounded-full bg-foreground shrink-0" />
              <div>
                <p className="text-sm font-semibold">{data.completed}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              <span className="w-3 h-3 rounded-full bg-gray-300 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{data.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </motion.div>

            <motion.div
              className="pt-2 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              <p className="text-xs text-gray-400">
                {data.completedPct.toFixed(0)}% completion rate
              </p>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
