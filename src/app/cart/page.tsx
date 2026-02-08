"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import {
  ChevronRight,
  Home,
  Minus,
  Plus,
  Trash2,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const { user } = useAuthStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Link href="/products">
          <Button className="bg-[#F85606] hover:bg-[#E04E05] text-white">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#F85606] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Cart</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {/* Cart Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="text-center py-3 text-sm font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.product.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Smartphone className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-medium text-sm hover:text-[#F85606]"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {item.product.category} | {item.product.brand}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-4 text-sm">
                  R{formatPrice(item.product.price)}
                </td>
                <td className="text-center py-4">
                  <div className="flex items-center justify-center border border-gray-300 rounded-md w-fit mx-auto">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="px-2 py-1 hover:bg-gray-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium border-x border-gray-300">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="px-2 py-1 hover:bg-gray-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="text-right py-4 font-semibold text-sm">
                  R{formatPrice(item.product.price * item.quantity)}
                </td>
                <td className="py-4">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Separator className="my-6" />

      {/* Cart Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <Link href="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Button variant="ghost" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Clear Cart
          </Button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg w-full md:w-auto md:min-w-[320px]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">
              R{formatPrice(getTotalPrice())}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium text-green-600">Free</span>
          </div>
          <Separator className="mb-4" />
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg text-[#F85606]">
              R{formatPrice(getTotalPrice())}
            </span>
          </div>
          <Link href={user ? "/checkout" : "/login"}>
            <Button className="w-full bg-[#F85606] hover:bg-[#E04E05] text-white">
              {user ? "Proceed to Checkout" : "Sign in to Checkout"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
