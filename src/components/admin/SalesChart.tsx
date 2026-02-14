"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRevenue } from "@/lib/utils/analytics";
import { formatPrice } from "@/lib/utils/format";

interface SalesChartProps {
  data7d: DailyRevenue[];
  data30d: DailyRevenue[];
  dataAll: DailyRevenue[];
}

type Range = "7d" | "30d" | "All";

const CHART_HEIGHT = 220;
const BAR_RADIUS = 4;

export default function SalesChart({
  data7d,
  data30d,
  dataAll,
}: SalesChartProps) {
  const [range, setRange] = useState<Range>("7d");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    if (range === "7d") return data7d;
    if (range === "30d") return data30d;
    return dataAll;
  }, [range, data7d, data30d, dataAll]);

  const maxRevenue = useMemo(
    () => Math.max(...data.map((d) => d.revenue), 1),
    [data]
  );

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const step = Math.ceil(maxRevenue / 4 / 1000) * 1000;
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(step * i);
    }
    return ticks;
  }, [maxRevenue]);

  const yMax = yTicks[yTicks.length - 1] || 1;

  // Layout
  const leftPad = 60;
  const rightPad = 16;
  const topPad = 12;
  const bottomPad = 32;
  const barCount = data.length || 1;

  return (
    <Card ref={ref}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Sales Report</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            {range === "7d"
              ? "Your weekly statistics"
              : range === "30d"
              ? "Your monthly statistics"
              : "All-time statistics"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
          {(["7d", "30d", "All"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                range === r
                  ? "bg-foreground text-white"
                  : "text-gray-500 hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <svg
          viewBox={`0 0 600 ${CHART_HEIGHT + topPad + bottomPad}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick) => {
            const y =
              topPad + CHART_HEIGHT - (tick / yMax) * CHART_HEIGHT;
            return (
              <g key={tick}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={600 - rightPad}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={leftPad - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {tick >= 1000 ? `R${Math.round(tick / 1000)}K` : `R${tick}`}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barAreaWidth =
              (600 - leftPad - rightPad) / barCount;
            const barWidth = Math.min(barAreaWidth * 0.6, 40);
            const x =
              leftPad + barAreaWidth * i + (barAreaWidth - barWidth) / 2;
            const barHeight = (d.revenue / yMax) * CHART_HEIGHT;
            const y = topPad + CHART_HEIGHT - barHeight;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <rect
                  x={leftPad + barAreaWidth * i}
                  y={topPad}
                  width={barAreaWidth}
                  height={CHART_HEIGHT + bottomPad}
                  fill="transparent"
                />

                {/* Bar */}
                <motion.rect
                  x={x}
                  width={barWidth}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={hoveredIdx === i ? "#000000" : "#1A1A1A"}
                  opacity={hoveredIdx === i ? 1 : 0.8}
                  initial={{ y: topPad + CHART_HEIGHT, height: 0 }}
                  animate={
                    isInView
                      ? { y, height: Math.max(barHeight, 0) }
                      : { y: topPad + CHART_HEIGHT, height: 0 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 80,
                    damping: 14,
                    delay: i * 0.04,
                  }}
                />

                {/* X-axis label */}
                <text
                  x={leftPad + barAreaWidth * i + barAreaWidth / 2}
                  y={topPad + CHART_HEIGHT + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400"
                >
                  {d.date}
                </text>

                {/* Tooltip */}
                {hoveredIdx === i && (
                  <g>
                    <rect
                      x={x + barWidth / 2 - 40}
                      y={y - 28}
                      width={80}
                      height={22}
                      rx={6}
                      fill="#1A1A1A"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 13}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-medium"
                    >
                      R{formatPrice(Math.round(d.revenue))}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
