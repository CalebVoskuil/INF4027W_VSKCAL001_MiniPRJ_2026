"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronDown, ChevronUp, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { getOrdersByUser } from "@/lib/firebase/firestore";
import { Order } from "@/types";
import { Timestamp } from "firebase/firestore";

function formatDate(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        const data = await getOrdersByUser(user.uid);
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Package className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-4">
              Start shopping to see your orders here.
            </p>
            <Link href="/products">
              <button className="px-6 py-2 bg-foreground text-white rounded-md hover:bg-gray-800">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Order Header */}
                <button
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Order #{order.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {order.status}
                    </Badge>
                    <span className="font-semibold">
                      R{formatPrice(order.totalAmount)}
                    </span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Order Details */}
                {expandedOrder === order.id && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Payment:</span>{" "}
                        <span className="capitalize font-medium">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>{" "}
                        <span className="font-medium">
                          {order.items.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded p-3">
                          <div className="relative w-12 h-12 bg-gray-100 rounded shrink-0">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                className="object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Smartphone className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} x R{formatPrice(item.price)}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">
                            R{formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
