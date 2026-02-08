"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrders, updateOrderStatus } from "@/lib/firebase/firestore";
import { Order } from "@/types";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

function formatDate(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrders([]);
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: "pending" | "completed") => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm">{order.userEmail}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-sm font-semibold">R{order.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm capitalize">{order.paymentMethod}</td>
                <td className="px-4 py-3">
                  <Select
                    value={order.status}
                    onValueChange={(val) => handleStatusChange(order.id, val as "pending" | "completed")}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-500">{loading ? "Loading..." : "No orders found"}</p>
        )}
      </div>
    </div>
  );
}
