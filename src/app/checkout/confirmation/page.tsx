"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") ?? "N/A";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-gray-500 mb-6">
        Thank you for your purchase. Your order has been placed successfully.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-500 mb-1">Order ID</p>
        <p className="font-mono font-semibold text-lg">{orderId}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/orders">
          <Button variant="outline" className="w-full sm:w-auto">
            <Package className="w-4 h-4 mr-2" />
            View Orders
          </Button>
        </Link>
        <Link href="/products">
          <Button className="w-full sm:w-auto bg-[#F85606] hover:bg-[#E04E05] text-white">
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-16 text-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
