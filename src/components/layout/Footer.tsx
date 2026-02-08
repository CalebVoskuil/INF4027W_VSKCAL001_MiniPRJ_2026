"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-gray-300">
      {/* Newsletter */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white text-lg font-semibold">
              Subscribe to get our updates
            </h3>
            <p className="text-sm text-gray-400">
              Get the latest deals and promotions delivered to your inbox.
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email address..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-w-[250px]"
            />
            <Button className="bg-[#F85606] hover:bg-[#E04E05] text-white flex-shrink-0">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              University of Cape Town, Rondebosch, Cape Town, 7700
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              +27 21 650 2100
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              info@technest.co.za
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-white font-semibold mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products?category=flagship" className="hover:text-[#F85606] transition-colors">
                Flagship Phones
              </Link>
            </li>
            <li>
              <Link href="/products?category=midrange" className="hover:text-[#F85606] transition-colors">
                Mid-Range Phones
              </Link>
            </li>
            <li>
              <Link href="/products?category=budget" className="hover:text-[#F85606] transition-colors">
                Budget Phones
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-[#F85606] transition-colors">
                Shop All
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-[#F85606] transition-colors">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-[#F85606] transition-colors">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-[#F85606] transition-colors">
                Order Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* Payments */}
        <div>
          <h4 className="text-white font-semibold mb-4">We Accept</h4>
          <div className="flex flex-wrap gap-2">
            {["Visa", "MasterCard", "PayPal", "Cash"].map((method) => (
              <span
                key={method}
                className="bg-gray-800 text-xs px-3 py-1.5 rounded border border-gray-700"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TechNest. All rights reserved. |
          INF4027W Mini Project 2026
        </div>
      </div>
    </footer>
  );
}
