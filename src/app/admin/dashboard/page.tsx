"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getProducts, getOrders, getAllUsers } from "@/lib/firebase/firestore";
import { Order, AppUser } from "@/types";
import { formatPrice } from "@/lib/utils/format";
import {
  getMonthlyComparison,
  getDailyRevenue,
  getOrderStatusBreakdown,
  getRecentOrders,
  MonthlyComparison,
  DailyRevenue,
  OrderStatusBreakdown,
} from "@/lib/utils/analytics";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import PerformanceRing from "@/components/admin/PerformanceRing";
import OrderTable from "@/components/admin/OrderTable";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [data7d, setData7d] = useState<DailyRevenue[]>([]);
  const [data30d, setData30d] = useState<DailyRevenue[]>([]);
  const [dataAll, setDataAll] = useState<DailyRevenue[]>([]);
  const [statusBreakdown, setStatusBreakdown] =
    useState<OrderStatusBreakdown | null>(null);
  const [recentOrders, setRecentOrdersList] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [, orders, users] = await Promise.all([
          getProducts([]),
          getOrders([]),
          getAllUsers(),
        ]);

        setComparison(getMonthlyComparison(orders, users));
        setData7d(getDailyRevenue(orders, 7));
        setData30d(getDailyRevenue(orders, 30));
        setDataAll(getDailyRevenue(orders, "all"));
        setStatusBreakdown(getOrderStatusBreakdown(orders));
        setRecentOrdersList(getRecentOrders(orders, 10));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={comparison?.revenue.current ?? 0}
          prefix="R"
          format={formatPrice}
          change={comparison?.revenue.change ?? 0}
          icon={DollarSign}
          index={0}
        />
        <StatCard
          title="Avg Order Value"
          value={Math.round(comparison?.avgOrderValue.current ?? 0)}
          prefix="R"
          format={formatPrice}
          change={comparison?.avgOrderValue.change ?? 0}
          icon={TrendingUp}
          index={1}
        />
        <StatCard
          title="Total Orders"
          value={comparison?.orderCount.current ?? 0}
          change={comparison?.orderCount.change ?? 0}
          icon={ShoppingBag}
          index={2}
        />
        <StatCard
          title="Total Customers"
          value={comparison?.customerCount.current ?? 0}
          change={comparison?.customerCount.change ?? 0}
          icon={Users}
          index={3}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data7d={data7d} data30d={data30d} dataAll={dataAll} />
        </div>
        <div>
          {statusBreakdown && <PerformanceRing data={statusBreakdown} />}
        </div>
      </div>

      {/* Row 3: Order History Table */}
      <OrderTable orders={recentOrders} />
    </div>
  );
}
