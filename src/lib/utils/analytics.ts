import { Timestamp } from "firebase/firestore";
import { Order, AppUser } from "@/types";

// ── Helpers ──────────────────────────────────────────────────

function toDate(ts: Timestamp | Date): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDay(date: Date, short = false): string {
  if (short) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Monthly Comparison ───────────────────────────────────────

export interface MonthlyMetric {
  current: number;
  previous: number;
  change: number; // percentage
}

export interface MonthlyComparison {
  revenue: MonthlyMetric;
  avgOrderValue: MonthlyMetric;
  orderCount: MonthlyMetric;
  customerCount: MonthlyMetric;
}

export function getMonthlyComparison(
  orders: Order[],
  users: AppUser[]
): MonthlyComparison {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );

  const thisMonthOrders = orders.filter(
    (o) => toDate(o.createdAt) >= thisMonthStart
  );
  const prevMonthOrders = orders.filter((o) => {
    const d = toDate(o.createdAt);
    return d >= prevMonthStart && d < thisMonthStart;
  });

  const thisRevenue = thisMonthOrders.reduce(
    (s, o) => s + o.totalAmount,
    0
  );
  const prevRevenue = prevMonthOrders.reduce(
    (s, o) => s + o.totalAmount,
    0
  );

  const thisAOV =
    thisMonthOrders.length > 0 ? thisRevenue / thisMonthOrders.length : 0;
  const prevAOV =
    prevMonthOrders.length > 0 ? prevRevenue / prevMonthOrders.length : 0;

  const customers = users.filter((u) => u.role === "customer");
  const thisMonthCustomers = customers.filter(
    (u) => toDate(u.createdAt) >= thisMonthStart
  ).length;
  const prevMonthCustomers = customers.filter((u) => {
    const d = toDate(u.createdAt);
    return d >= prevMonthStart && d < thisMonthStart;
  }).length;

  function pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  return {
    revenue: {
      current: thisRevenue,
      previous: prevRevenue,
      change: pctChange(thisRevenue, prevRevenue),
    },
    avgOrderValue: {
      current: thisAOV,
      previous: prevAOV,
      change: pctChange(thisAOV, prevAOV),
    },
    orderCount: {
      current: thisMonthOrders.length,
      previous: prevMonthOrders.length,
      change: pctChange(thisMonthOrders.length, prevMonthOrders.length),
    },
    customerCount: {
      current: thisMonthCustomers,
      previous: prevMonthCustomers,
      change: pctChange(thisMonthCustomers, prevMonthCustomers),
    },
  };
}

// ── Daily Revenue ────────────────────────────────────────────

export interface DailyRevenue {
  date: string;
  revenue: number;
  rawDate: Date;
}

export function getDailyRevenue(
  orders: Order[],
  days: number | "all"
): DailyRevenue[] {
  if (orders.length === 0) return [];

  const now = new Date();
  const today = startOfDay(now);

  let filtered = orders;
  let numDays: number;

  if (days === "all") {
    // Find the earliest order and span from there
    const earliest = orders.reduce((min, o) => {
      const d = toDate(o.createdAt);
      return d < min ? d : min;
    }, toDate(orders[0].createdAt));
    numDays = Math.ceil(
      (today.getTime() - startOfDay(earliest).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  } else {
    numDays = days;
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days + 1);
    filtered = orders.filter((o) => toDate(o.createdAt) >= cutoff);
  }

  // Build day buckets
  const buckets = new Map<string, number>();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (numDays - 1 - i));
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const order of filtered) {
    const d = toDate(order.createdAt);
    const key = startOfDay(d).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + order.totalAmount);
    }
  }

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const rawDate = new Date(key + "T00:00:00");
    return {
      date: numDays <= 7 ? formatDay(rawDate, true) : formatDay(rawDate),
      revenue,
      rawDate,
    };
  });
}

// ── Order Status Breakdown ───────────────────────────────────

export interface OrderStatusBreakdown {
  total: number;
  completed: number;
  pending: number;
  completedPct: number;
  pendingPct: number;
}

export function getOrderStatusBreakdown(
  orders: Order[]
): OrderStatusBreakdown {
  const completed = orders.filter((o) => o.status === "completed").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const total = orders.length;

  return {
    total,
    completed,
    pending,
    completedPct: total > 0 ? (completed / total) * 100 : 0,
    pendingPct: total > 0 ? (pending / total) * 100 : 0,
  };
}

// ── Recent Orders ────────────────────────────────────────────

export function getRecentOrders(orders: Order[], count: number): Order[] {
  return [...orders]
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, count);
}
