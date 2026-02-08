"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  Home,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import AuthGuard from "@/components/layout/AuthGuard";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { createOrder } from "@/lib/firebase/firestore";
import { toast } from "sonner";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const paymentMethods = [
  { value: "card" as const, label: "Credit Card", icon: CreditCard },
  { value: "paypal" as const, label: "PayPal", icon: Wallet },
  { value: "cash" as const, label: "Cash on Delivery", icon: Banknote },
];

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "paypal">("card");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) return;
    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images?.[0] ?? "",
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice,
      }));

      const subtotal = getTotalPrice();

      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        items: orderItems,
        subtotal,
        totalAmount: subtotal,
        paymentMethod,
        status: paymentMethod === "cash" ? "pending" : "completed",
        createdAt: new Date(),
        completedAt: paymentMethod === "cash" ? null : new Date(),
      });

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/checkout/confirmation?id=${orderId}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link href="/products">
            <Button className="bg-[#F85606] hover:bg-[#E04E05] text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#F85606] flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-[#F85606]">Cart</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["Information", "Shipping", "Payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i + 1
                    ? "bg-green-500 text-white"
                    : step === i + 1
                    ? "bg-[#F85606] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm ${
                  step === i + 1 ? "font-medium text-gray-900" : "text-gray-500"
                }`}
              >
                {s}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Billing Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Billing Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input className="mt-1" {...register("firstName")} />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input className="mt-1" {...register("lastName")} />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input className="mt-1" placeholder="+27 XX XXX XXXX" {...register("phone")} />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input className="mt-1" type="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input className="mt-1" placeholder="Street address" {...register("address")} />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input className="mt-1" {...register("city")} />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input className="mt-1" {...register("zipCode")} />
                    {errors.zipCode && (
                      <p className="text-sm text-red-500 mt-1">{errors.zipCode.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Any special requests..."
                      {...register("notes")}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === method.value
                          ? "border-[#F85606] bg-[#F85606]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className={`w-5 h-5 ${paymentMethod === method.value ? "text-[#F85606]" : "text-gray-500"}`} />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * This is a simulated payment. No real charges will be made.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F85606] hover:bg-[#E04E05] text-white py-6 text-lg"
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-32">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="relative w-14 h-14 bg-gray-50 rounded flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Smartphone className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      R{(item.product.price * item.quantity).toLocaleString("en-ZA")}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>R{getTotalPrice().toLocaleString("en-ZA")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#F85606]">
                  R{getTotalPrice().toLocaleString("en-ZA")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
