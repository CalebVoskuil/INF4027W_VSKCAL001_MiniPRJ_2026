"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useSpring, useTransform } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, getOrders, getAllUsers } from "@/lib/firebase/firestore";
import { Product, Order, AppUser } from "@/types";
import HorizontalBarChart from "@/components/admin/HorizontalBarChart";

// ── Monochrome palette ───────────────────────────────────────
const RING_COLORS = ["#1A1A1A", "#6B7280", "#D1D5DB", "#9CA3AF", "#374151", "#E5E7EB"];

// ── KPI Card (animated count-up, no % change) ────────────────
function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  format,
  index,
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const numRef = useRef<HTMLSpanElement>(null);
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => {
    const formatted = format ? format(Math.round(v)) : Math.round(v).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [spring, value, isInView]);

  useEffect(() => {
    const unsub = display.on("change", (v) => {
      if (numRef.current) numRef.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.45, ease: "easeOut" }}
    >
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            <span ref={numRef}>{prefix}0{suffix}</span>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Donut Chart (SVG + Framer Motion) ────────────────────────
function DonutChart({
  title,
  data,
  centerLabel,
  centerValue,
}: {
  title: string;
  data: { name: string; value: number }[];
  centerLabel: string;
  centerValue: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const RADIUS = 70;
  const STROKE = 14;
  const SIZE = (RADIUS + STROKE) * 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * CIRCUMFERENCE;
    const offset = -data
      .slice(0, i)
      .reduce((sum, segment) => sum + (segment.value / total) * CIRCUMFERENCE, 0);
    return { ...d, dash, offset, color: RING_COLORS[i % RING_COLORS.length] };
  });

  // Center count-up
  const centerRef = useRef<HTMLSpanElement>(null);
  const centerSpring = useSpring(0, { stiffness: 40, damping: 18 });
  const centerDisplay = useTransform(centerSpring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) centerSpring.set(centerValue);
  }, [centerSpring, centerValue, isInView]);

  useEffect(() => {
    const unsub = centerDisplay.on("change", (v) => {
      if (centerRef.current) centerRef.current.textContent = v;
    });
    return unsub;
  }, [centerDisplay]);

  return (
    <Card ref={ref}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="relative shrink-0">
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="transform -rotate-90"
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth={STROKE}
                />
                {segments.map((seg, i) => (
                  <motion.circle
                    key={i}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`}
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={
                      isInView
                        ? { strokeDashoffset: seg.offset }
                        : { strokeDashoffset: CIRCUMFERENCE }
                    }
                    transition={{
                      duration: 1,
                      delay: 0.3 + i * 0.15,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  <span ref={centerRef}>0</span>
                </span>
                <span className="text-[10px] text-gray-400">{centerLabel}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {segments.map((seg, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2.5"
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.35 }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div>
                    <p className="text-sm font-semibold">{seg.value}</p>
                    <p className="text-[10px] text-gray-400">{seg.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Grouped Vertical Bar Chart (SVG + Framer Motion) ─────────
function GroupedBarChart({
  title,
  data,
  keys,
  colors,
  labels,
}: {
  title: string;
  data: { name: string; [key: string]: string | number }[];
  keys: string[];
  colors: string[];
  labels: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const maxVal = Math.max(
    ...data.flatMap((d) => keys.map((k) => Number(d[k]) || 0)),
    1
  );

  const CHART_H = 200;
  const LEFT = 50;
  const RIGHT = 16;
  const TOP = 12;
  const BOTTOM = 36;
  const SVG_W = 500;
  const groupWidth = (SVG_W - LEFT - RIGHT) / data.length;
  const barW = Math.min(groupWidth * 0.3, 28);
  const gap = 4;

  const yStep = Math.ceil(maxVal / 4 / 10) * 10 || 1;
  const yTicks = Array.from({ length: 5 }, (_, i) => i * yStep);
  const yMax = yTicks[yTicks.length - 1] || 1;

  return (
    <Card ref={ref}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-4">
          {keys.map((k, i) => (
            <div key={k} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="text-xs text-gray-500">{labels[i]}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H + TOP + BOTTOM}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid */}
          {yTicks.map((tick) => {
            const y = TOP + CHART_H - (tick / yMax) * CHART_H;
            return (
              <g key={tick}>
                <line
                  x1={LEFT}
                  y1={y}
                  x2={SVG_W - RIGHT}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeDasharray="4 4"
                />
                <text x={LEFT - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, gi) => {
            const groupX = LEFT + groupWidth * gi;

            return (
              <g key={d.name}>
                {keys.map((k, ki) => {
                  const val = Number(d[k]) || 0;
                  const barH = (val / yMax) * CHART_H;
                  const x =
                    groupX +
                    (groupWidth - (barW * keys.length + gap * (keys.length - 1))) / 2 +
                    ki * (barW + gap);
                  const y = TOP + CHART_H - barH;
                  const barId = `${d.name}-${k}`;

                  return (
                    <g
                      key={k}
                      onMouseEnter={() => setHoveredBar(barId)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer"
                    >
                      <motion.rect
                        x={x}
                        width={barW}
                        rx={3}
                        fill={colors[ki]}
                        opacity={hoveredBar === barId ? 1 : 0.8}
                        initial={{ y: TOP + CHART_H, height: 0 }}
                        animate={
                          isInView
                            ? { y, height: Math.max(barH, 0) }
                            : { y: TOP + CHART_H, height: 0 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 80,
                          damping: 14,
                          delay: gi * 0.1 + ki * 0.05,
                        }}
                      />
                      {hoveredBar === barId && (
                        <g>
                          <rect
                            x={x + barW / 2 - 20}
                            y={y - 22}
                            width={40}
                            height={18}
                            rx={5}
                            fill="#1A1A1A"
                          />
                          <text
                            x={x + barW / 2}
                            y={y - 10}
                            textAnchor="middle"
                            className="text-[9px] fill-white font-medium"
                          >
                            {val}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                <text
                  x={groupX + groupWidth / 2}
                  y={TOP + CHART_H + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400"
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

// ── Vertical Bar Chart (for Revenue by Payment) ──────────────
function VerticalBarChart({
  title,
  data,
  formatValue = (v) => v.toLocaleString(),
}: {
  title: string;
  data: { name: string; value: number }[];
  formatValue?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const CHART_H = 200;
  const LEFT = 60;
  const RIGHT = 16;
  const TOP = 12;
  const BOTTOM = 36;
  const SVG_W = 500;
  const barCount = data.length || 1;
  const barAreaW = (SVG_W - LEFT - RIGHT) / barCount;
  const barW = Math.min(barAreaW * 0.5, 50);

  const yStep = Math.ceil(maxVal / 4 / 1000) * 1000 || 1;
  const yTicks = Array.from({ length: 5 }, (_, i) => i * yStep);
  const yMax = yTicks[yTicks.length - 1] || 1;

  const barColors = ["#1A1A1A", "#6B7280", "#D1D5DB"];

  return (
    <Card ref={ref}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H + TOP + BOTTOM}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {yTicks.map((tick) => {
            const y = TOP + CHART_H - (tick / yMax) * CHART_H;
            return (
              <g key={tick}>
                <line
                  x1={LEFT}
                  y1={y}
                  x2={SVG_W - RIGHT}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeDasharray="4 4"
                />
                <text x={LEFT - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                  {tick >= 1000 ? `R${Math.round(tick / 1000)}K` : `R${tick}`}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = LEFT + barAreaW * i + (barAreaW - barW) / 2;
            const barH = (d.value / yMax) * CHART_H;
            const y = TOP + CHART_H - barH;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={LEFT + barAreaW * i}
                  y={TOP}
                  width={barAreaW}
                  height={CHART_H + BOTTOM}
                  fill="transparent"
                />
                <motion.rect
                  x={x}
                  width={barW}
                  rx={4}
                  fill={barColors[i % barColors.length]}
                  opacity={hoveredIdx === i ? 1 : 0.8}
                  initial={{ y: TOP + CHART_H, height: 0 }}
                  animate={
                    isInView
                      ? { y, height: Math.max(barH, 0) }
                      : { y: TOP + CHART_H, height: 0 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 80,
                    damping: 14,
                    delay: i * 0.1,
                  }}
                />
                <text
                  x={LEFT + barAreaW * i + barAreaW / 2}
                  y={TOP + CHART_H + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400"
                >
                  {d.name}
                </text>
                {hoveredIdx === i && (
                  <g>
                    <rect
                      x={x + barW / 2 - 36}
                      y={y - 26}
                      width={72}
                      height={20}
                      rx={6}
                      fill="#1A1A1A"
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 12}
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
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [p, o, u] = await Promise.all([
          getProducts([]),
          getOrders([]),
          getAllUsers(),
        ]);
        setProducts(p);
        setOrders(o);
        setUsers(u);
      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-56 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-56 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  // ===== FINANCIAL CALCULATIONS =====
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCost = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
    0
  );
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const paymentBreakdown = [
    { name: "Card", value: orders.filter((o) => o.paymentMethod === "card").length },
    { name: "PayPal", value: orders.filter((o) => o.paymentMethod === "paypal").length },
    { name: "Cash", value: orders.filter((o) => o.paymentMethod === "cash").length },
  ].filter((p) => p.value > 0);

  const revenueByPayment = [
    {
      name: "Card",
      value: orders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.totalAmount, 0),
    },
    {
      name: "PayPal",
      value: orders.filter((o) => o.paymentMethod === "paypal").reduce((s, o) => s + o.totalAmount, 0),
    },
    {
      name: "Cash",
      value: orders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.totalAmount, 0),
    },
  ].filter((d) => d.value > 0);

  // ===== PRODUCT CALCULATIONS =====
  const topSellingProducts = [...products]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5)
    .map((p) => ({
      label: p.name.length > 22 ? p.name.slice(0, 22) + "..." : p.name,
      value: p.salesCount,
    }));

  const mostViewedProducts = [...products]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((p) => ({
      label: p.name.length > 22 ? p.name.slice(0, 22) + "..." : p.name,
      value: p.views,
    }));

  const categoryData = [
    {
      name: "Budget",
      products: products.filter((p) => p.category === "budget").length,
      sales: products.filter((p) => p.category === "budget").reduce((s, p) => s + p.salesCount, 0),
    },
    {
      name: "Mid-Range",
      products: products.filter((p) => p.category === "midrange").length,
      sales: products.filter((p) => p.category === "midrange").reduce((s, p) => s + p.salesCount, 0),
    },
    {
      name: "Flagship",
      products: products.filter((p) => p.category === "flagship").length,
      sales: products.filter((p) => p.category === "flagship").reduce((s, p) => s + p.salesCount, 0),
    },
  ];

  // ===== CUSTOMER CALCULATIONS =====
  const customers = users.filter((u) => u.role === "customer");
  const customerOrderMap: Record<string, { email: string; total: number; count: number }> = {};
  orders.forEach((o) => {
    if (!customerOrderMap[o.userId]) {
      customerOrderMap[o.userId] = { email: o.userEmail, total: 0, count: 0 };
    }
    customerOrderMap[o.userId].total += o.totalAmount;
    customerOrderMap[o.userId].count += 1;
  });

  const topCustomers = Object.entries(customerOrderMap)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .map(([_id, data]) => ({
      email: data.email.length > 25 ? data.email.slice(0, 25) + "..." : data.email,
      totalSpent: data.total,
      orders: data.count,
    }));

  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const locationData: Record<string, number> = {};
  customers.forEach((c) => {
    const loc = c.demographics?.location || "Unknown";
    locationData[loc] = (locationData[loc] || 0) + 1;
  });
  const demographicsData = Object.entries(locationData).map(([name, value]) => ({ name, value }));

  async function generateInsights() {
    setInsightLoading(true);
    setInsightText(null);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalRevenue,
          totalCost,
          grossProfit,
          profitMargin,
          totalOrders: orders.length,
          avgOrderValue,
          paymentBreakdown,
          revenueByPayment,
          topSellingProducts,
          mostViewedProducts,
          categoryData,
          totalCustomers: customers.length,
          topCustomers,
          demographics: demographicsData,
        }),
      });
      const data = await res.json();
      setInsightText(data.summary ?? "No insights available.");
    } catch {
      setInsightText("Failed to generate insights. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <Button
          onClick={generateInsights}
          disabled={insightLoading}
          className="bg-foreground hover:bg-gray-800 text-white rounded-full px-5 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {insightLoading ? "Analyzing..." : "AI Insights"}
        </Button>
      </div>

      {/* AI Insights Card */}
      <AnimatePresence>
        {insightLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-gray-400 animate-pulse" />
                  <span className="text-sm font-medium text-gray-400">Generating insights...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/6" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {insightText && !insightLoading && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Sparkles className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {insightText}
                    </div>
                  </div>
                  <button
                    onClick={() => setInsightText(null)}
                    className="p-1 text-gray-400 hover:text-foreground rounded-md transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="financial">
        <TabsList className="bg-gray-100 rounded-full p-0.5 mb-6">
          <TabsTrigger
            value="financial"
            className="rounded-full px-5 py-1.5 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Financial
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="rounded-full px-5 py-1.5 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="rounded-full px-5 py-1.5 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Customers
          </TabsTrigger>
        </TabsList>

        {/* ===== FINANCIAL REPORT ===== */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Revenue" value={totalRevenue} prefix="R" format={formatPrice} index={0} />
            <KpiCard title="Total Cost" value={totalCost} prefix="R" format={formatPrice} index={1} />
            <KpiCard title="Gross Profit" value={grossProfit} prefix="R" format={formatPrice} index={2} />
            <KpiCard title="Profit Margin" value={profitMargin} suffix="%" index={3} format={(v) => v.toFixed(1)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VerticalBarChart
              title="Revenue by Payment Method"
              data={revenueByPayment}
              formatValue={(v) => `R${formatPrice(v)}`}
            />
            <DonutChart
              title="Payment Methods Distribution"
              data={paymentBreakdown}
              centerLabel="Orders"
              centerValue={orders.length}
            />
          </div>
        </TabsContent>

        {/* ===== PRODUCT REPORT ===== */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorizontalBarChart
              title="Top 5 Best Sellers"
              data={topSellingProducts}
              color="#1A1A1A"
              formatValue={(v) => `${v} sales`}
            />
            <HorizontalBarChart
              title="Most Viewed Products"
              data={mostViewedProducts}
              color="#6B7280"
              formatValue={(v) => `${v} views`}
            />
          </div>

          <GroupedBarChart
            title="Category Performance"
            data={categoryData}
            keys={["products", "sales"]}
            colors={["#1A1A1A", "#D1D5DB"]}
            labels={["Products", "Sales"]}
          />
        </TabsContent>

        {/* ===== CUSTOMER REPORT ===== */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Total Customers" value={customers.length} index={0} />
            <KpiCard title="Avg Order Value" value={Math.round(avgOrderValue)} prefix="R" format={formatPrice} index={1} />
            <KpiCard title="Total Orders" value={orders.length} index={2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerList customers={topCustomers} />
            <DonutChart
              title="Customer Demographics"
              data={demographicsData}
              centerLabel="Customers"
              centerValue={customers.length}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Top Customers List (animated rows) ───────────────────────
function CustomerList({
  customers,
}: {
  customers: { email: string; totalSpent: number; orders: number }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <Card ref={ref}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top Customers by Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No customer data yet</p>
        ) : (
          <div className="space-y-3">
            {customers.map((c, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between text-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-foreground text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{c.email}</p>
                    <p className="text-xs text-gray-400">{c.orders} orders</p>
                  </div>
                </div>
                <span className="font-semibold text-foreground">
                  R{formatPrice(c.totalSpent)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
