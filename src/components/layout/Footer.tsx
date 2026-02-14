"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Logo + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/">
              <h2 className="text-xl font-bold tracking-tight mb-3">
                TechNest<span className="text-gray-400">.</span>
              </h2>
            </Link>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">
              Your destination for premium smartphones. AI-powered search to find the perfect phone.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter Your Email"
                className="bg-gray-50 border-gray-200 text-sm h-10 max-w-[220px]"
              />
              <Button size="sm" className="bg-foreground text-white hover:bg-gray-800 h-10 px-5 text-sm font-medium">
                Subscribe
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  AI Search
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-foreground transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact Information</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                info@technest.co.za
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                +27 21 650 2100
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                UCT, Rondebosch, Cape Town, 7700
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods + Socials */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Payment Icons */}
          <div className="flex items-center gap-2">
            {["Visa", "MasterCard", "PayPal", "Apple Pay"].map((method) => (
              <span
                key={method}
                className="bg-gray-50 text-[11px] text-gray-500 font-medium px-3 py-1.5 rounded border border-gray-200"
              >
                {method}
              </span>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="p-2 text-gray-400 hover:text-foreground rounded-full hover:bg-gray-50 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TechNest. All rights reserved. | INF4027W Mini Project 2026
        </div>
      </div>
    </footer>
  );
}
