"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts, getOrders, getAllUsers } from "@/lib/firebase/firestore";
import { Product, Order, AppUser } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [products, orders, users] = await Promise.all([
          getProducts([]),
          getOrders([]),
          getAllUsers(),
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const customers = users.filter((u) => u.role === "customer");

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalCustomers: customers.length,
          pendingOrders: orders.filter((o) => o.status === "pending").length,
          completedOrders: orders.filter((o) => o.status === "completed").length,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: `R${stats.totalRevenue.toLocaleString("en-ZA")}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Orders</span>
                <span className="font-semibold text-yellow-600">
                  {stats.pendingOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Orders</span>
                <span className="font-semibold text-green-600">
                  {stats.completedOrders}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>
                    <span className="font-semibold">
                      R{order.totalAmount.toLocaleString("en-ZA")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
