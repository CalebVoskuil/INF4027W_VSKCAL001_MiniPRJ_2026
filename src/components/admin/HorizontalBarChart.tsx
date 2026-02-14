"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarItem {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  title: string;
  data: BarItem[];
  color?: string;
  formatValue?: (v: number) => string;
}

const CHART_HEIGHT_PER_BAR = 44;
const LABEL_WIDTH = 130;
const BAR_HEIGHT = 24;
const BAR_RADIUS = 4;

export default function HorizontalBarChart({
  title,
  data,
  color = "#1A1A1A",
  formatValue = (v) => v.toLocaleString(),
}: HorizontalBarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const svgWidth = 500;
  const chartWidth = svgWidth - LABEL_WIDTH - 16;
  const svgHeight = data.length * CHART_HEIGHT_PER_BAR + 8;

  return (
    <Card ref={ref}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {data.map((d, i) => {
              const y = i * CHART_HEIGHT_PER_BAR + (CHART_HEIGHT_PER_BAR - BAR_HEIGHT) / 2;
              const barWidth = (d.value / maxValue) * chartWidth;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Label */}
                  <text
                    x={LABEL_WIDTH - 8}
                    y={y + BAR_HEIGHT / 2 + 4}
                    textAnchor="end"
                    className="text-[11px] fill-gray-500"
                  >
                    {d.label}
                  </text>

                  {/* Track */}
                  <rect
                    x={LABEL_WIDTH}
                    y={y}
                    width={chartWidth}
                    height={BAR_HEIGHT}
                    rx={BAR_RADIUS}
                    fill="#F3F4F6"
                  />

                  {/* Animated bar */}
                  <motion.rect
                    x={LABEL_WIDTH}
                    y={y}
                    height={BAR_HEIGHT}
                    rx={BAR_RADIUS}
                    fill={color}
                    opacity={hoveredIdx === i ? 1 : 0.8}
                    initial={{ width: 0 }}
                    animate={
                      isInView
                        ? { width: Math.max(barWidth, 0) }
                        : { width: 0 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 70,
                      damping: 14,
                      delay: i * 0.08,
                    }}
                  />

                  {/* Value text */}
                  <motion.text
                    x={LABEL_WIDTH + barWidth + 8}
                    y={y + BAR_HEIGHT / 2 + 4}
                    textAnchor="start"
                    className="text-[11px] fill-gray-500 font-medium"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: i * 0.08 + 0.4, duration: 0.3 }}
                  >
                    {formatValue(d.value)}
                  </motion.text>

                  {/* Hover tooltip */}
                  {hoveredIdx === i && (
                    <g>
                      <rect
                        x={LABEL_WIDTH + barWidth / 2 - 35}
                        y={y - 24}
                        width={70}
                        height={20}
                        rx={6}
                        fill="#1A1A1A"
                      />
                      <text
                        x={LABEL_WIDTH + barWidth / 2}
                        y={y - 10}
                        textAnchor="middle"
                        className="text-[10px] fill-white font-medium"
                      >
                        {formatValue(d.value)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
