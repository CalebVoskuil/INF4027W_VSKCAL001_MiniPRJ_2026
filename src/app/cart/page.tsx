"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import {
  Minus,
  Plus,
  Trash2,
  Smartphone,
  ShoppingBag,
  ArrowRight,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const steps = [
  { number: 1, label: "Shopping cart" },
  { number: 2, label: "Checkout details" },
  { number: 3, label: "Order complete" },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const { user } = useAuthStore();

  const currentStep = 1;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Link href="/products">
          <Button className="bg-foreground hover:bg-gray-800 text-white">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = 0; // Free shipping
  const total = subtotal + deliveryFee;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-8">Your Shopping Cart</h1>

      {/* Step Progress */}
      <div className="flex items-center justify-center gap-0 mb-10 max-w-lg mx-auto">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  currentStep >= step.number
                    ? "bg-foreground text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.number}
              </div>
              <span
                className={`text-sm whitespace-nowrap ${
                  currentStep >= step.number
                    ? "font-medium text-foreground"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-gray-200 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Cart Items */}
        <div className="lg:col-span-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your cart</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm"
            >
              Clear All
            </Button>
          </div>

          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4"
              >
                {/* Product Image */}
                <div className="relative w-20 h-20 bg-gray-50 rounded-lg shrink-0">
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

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="font-medium text-sm hover:underline line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {item.product.brand} &middot; {item.product.category}
                  </p>
                  <p className="font-semibold text-sm mt-1.5">
                    R{formatPrice(item.product.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="px-2.5 py-1.5 hover:bg-gray-50 rounded-l-lg transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium min-w-[32px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="px-2.5 py-1.5 hover:bg-gray-50 rounded-r-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-sm">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-semibold mb-5">Order Summary</h2>

            {/* Coupon Code */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Coupon Code"
                  className="pl-9 bg-gray-50 border-gray-200 text-sm h-10"
                />
              </div>
              <Button
                size="sm"
                className="bg-foreground text-white hover:bg-gray-800 h-10 px-5 text-sm font-medium"
              >
                Apply
              </Button>
            </div>

            {/* Line items */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">R{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-medium text-green-600">
                  {deliveryFee === 0 ? "Free" : `R${formatPrice(deliveryFee)}`}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5" />

            {/* Total */}
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-xl">R{formatPrice(total)}</span>
            </div>

            {/* Checkout Button */}
            <Link href={user ? "/checkout" : "/login"} className="block">
              <Button className="w-full bg-foreground hover:bg-gray-800 text-white h-12 text-sm font-medium rounded-xl">
                {user ? "Go to Checkout" : "Sign in to Checkout"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
