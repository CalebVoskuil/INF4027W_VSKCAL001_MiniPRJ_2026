"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Search } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils/format";

interface OrderTableProps {
  orders: Order[];
}

function formatDate(ts: Timestamp | Date): string {
  const d = ts instanceof Timestamp ? ts.toDate() : ts;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(ts: Timestamp | Date): string {
  const d = ts instanceof Timestamp ? ts.toDate() : ts;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: "easeOut",
    },
  }),
};

export default function OrderTable({ orders }: OrderTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.items.some((item) =>
          item.productName.toLowerCase().includes(q)
        ) ||
        o.userEmail.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  return (
    <Card ref={ref}>
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Order History</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-foreground/20 w-48"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No orders found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const firstItem = order.items[0];
                  const itemCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );

                  return (
                    <motion.tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      variants={rowVariants}
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      custom={i}
                    >
                      {/* Product */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {firstItem?.productImage ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {/* Plain img to avoid next/image hostname restrictions on legacy order data */}
                              <img
                                src={firstItem.productImage}
                                alt={firstItem.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[180px]">
                              {firstItem?.productName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {itemCount} {itemCount === 1 ? "Item" : "Items"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-2">
                        <p className="text-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          at {formatTime(order.createdAt)}
                        </p>
                      </td>

                      {/* Order ID */}
                      <td className="py-3 px-2 text-gray-500 font-mono text-xs">
                        #{order.id.slice(0, 10)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-2 text-foreground">
                        {order.userEmail.split("@")[0]}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-2 text-right font-semibold text-foreground">
                        R{formatPrice(order.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-right">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            order.status === "completed"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Completed"
                            : "Pending"}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
