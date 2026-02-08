"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, getOrders, getAllUsers } from "@/lib/firebase/firestore";
import { Product, Order, AppUser } from "@/types";

const COLORS = ["#F85606", "#0891b2", "#16a34a", "#eab308", "#7c3aed", "#ec4899"];

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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
      revenue: orders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.totalAmount, 0),
    },
    {
      name: "PayPal",
      revenue: orders.filter((o) => o.paymentMethod === "paypal").reduce((s, o) => s + o.totalAmount, 0),
    },
    {
      name: "Cash",
      revenue: orders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.totalAmount, 0),
    },
  ];

  // ===== PRODUCT CALCULATIONS =====
  const topSellingProducts = [...products]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5)
    .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name, sales: p.salesCount, revenue: p.salesCount * p.price }));

  const mostViewedProducts = [...products]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name, views: p.views }));

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
    .map(([id, data]) => ({
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

      <Tabs defaultValue="financial">
        <TabsList className="mb-6">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* ===== FINANCIAL REPORT ===== */}
        <TabsContent value="financial">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">R{formatPrice(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold">R{formatPrice(totalCost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Gross Profit</p>
                <p className="text-2xl font-bold text-blue-600">R{formatPrice(grossProfit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-600">{profitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Revenue by Payment Method</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByPayment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(val) => `R${formatPrice(Number(val))}`} />
                    <Bar dataKey="revenue" fill="#F85606" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Payment Methods Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {paymentBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== PRODUCT REPORT ===== */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Top 5 Best Sellers</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSellingProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#F85606" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Most Viewed Products</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mostViewedProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#0891b2" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-lg">Category Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="products" fill="#7c3aed" name="Products" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sales" fill="#F85606" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CUSTOMER REPORT ===== */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold text-[#F85606]">R{formatPrice(Math.round(avgOrderValue))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Customers by Spending</CardTitle></CardHeader>
              <CardContent>
                {topCustomers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No customer data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-[#F85606] text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{c.email}</p>
                            <p className="text-xs text-gray-500">{c.orders} orders</p>
                          </div>
                        </div>
                        <span className="font-semibold">R{formatPrice(c.totalSpent)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Customer Demographics</CardTitle></CardHeader>
              <CardContent>
                {demographicsData.length === 0 ? (
                  <p className="text-gray-500 text-sm">No demographic data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={demographicsData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {demographicsData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
