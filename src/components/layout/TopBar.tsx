"use client";

import { MapPin, Phone, Facebook, Twitter, Instagram } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-foreground text-white text-xs py-2">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Cape Town, South Africa
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            +27 21 650 2100
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mr-2">ZAR</span>
          <a href="#" className="hover:text-coral transition-colors">
            <Facebook className="w-3.5 h-3.5" />
          </a>
          <a href="#" className="hover:text-coral transition-colors">
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a href="#" className="hover:text-coral transition-colors">
            <Instagram className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
