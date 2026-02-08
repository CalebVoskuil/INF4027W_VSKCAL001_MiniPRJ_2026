"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const BRANDS = [
  "Samsung",
  "Apple",
  "Xiaomi",
  "Google",
  "OnePlus",
  "Motorola",
  "Nothing",
  "Oppo",
  "Realme",
  "Tecno",
];

const CATEGORIES = [
  { value: "budget", label: "Budget Phones" },
  { value: "midrange", label: "Mid-Range Phones" },
  { value: "flagship", label: "Flagship Phones" },
];

const RAM_OPTIONS = ["4GB", "6GB", "8GB", "12GB", "16GB"];
const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

interface FilterSidebarProps {
  onMobileClose?: () => void;
}

export default function FilterSidebar({ onMobileClose }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands")?.split(",").filter(Boolean) ?? []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") ?? ""
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") ?? "0"),
    parseInt(searchParams.get("maxPrice") ?? "50000"),
  ]);
  const [selectedRam, setSelectedRam] = useState<string[]>(
    searchParams.get("ram")?.split(",").filter(Boolean) ?? []
  );
  const [selectedStorage, setSelectedStorage] = useState<string[]>(
    searchParams.get("storage")?.split(",").filter(Boolean) ?? []
  );

  const activeFilterCount =
    selectedBrands.length +
    (selectedCategory ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0) +
    selectedRam.length +
    selectedStorage.length;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
    if (selectedCategory) params.set("category", selectedCategory);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 50000) params.set("maxPrice", priceRange[1].toString());
    if (selectedRam.length) params.set("ram", selectedRam.join(","));
    if (selectedStorage.length) params.set("storage", selectedStorage.join(","));
    router.push(`/products?${params.toString()}`);
    onMobileClose?.();
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategory("");
    setPriceRange([0, 50000]);
    setSelectedRam([]);
    setSelectedStorage([]);
    router.push("/products");
    onMobileClose?.();
  };

  // Auto-apply on change
  useEffect(() => {
    const timeout = setTimeout(applyFilters, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrands, selectedCategory, priceRange, selectedRam, selectedStorage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="bg-[#F85606] text-white text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-[#F85606] hover:text-[#E04E05]"
          >
            Clear All
          </Button>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h4 className="font-medium text-sm mb-3">Categories</h4>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selectedCategory === cat.value}
                onCheckedChange={(checked) =>
                  setSelectedCategory(checked ? cat.value : "")
                }
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <h4 className="font-medium text-sm mb-3">Brands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {BRANDS.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-sm mb-3">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          max={50000}
          step={500}
          className="mb-3"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
            R{priceRange[0].toLocaleString("en-ZA")}
          </span>
          <span className="text-gray-400">-</span>
          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
            R{priceRange[1].toLocaleString("en-ZA")}
          </span>
        </div>
      </div>

      <Separator />

      {/* RAM */}
      <div>
        <h4 className="font-medium text-sm mb-3">RAM</h4>
        <div className="flex flex-wrap gap-2">
          {RAM_OPTIONS.map((ram) => (
            <button
              key={ram}
              onClick={() =>
                setSelectedRam(
                  selectedRam.includes(ram)
                    ? selectedRam.filter((r) => r !== ram)
                    : [...selectedRam, ram]
                )
              }
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedRam.includes(ram)
                  ? "bg-[#F85606] text-white border-[#F85606]"
                  : "border-gray-300 hover:border-[#F85606]"
              }`}
            >
              {ram}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Storage */}
      <div>
        <h4 className="font-medium text-sm mb-3">Storage</h4>
        <div className="flex flex-wrap gap-2">
          {STORAGE_OPTIONS.map((storage) => (
            <button
              key={storage}
              onClick={() =>
                setSelectedStorage(
                  selectedStorage.includes(storage)
                    ? selectedStorage.filter((s) => s !== storage)
                    : [...selectedStorage, storage]
                )
              }
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedStorage.includes(storage)
                  ? "bg-[#F85606] text-white border-[#F85606]"
                  : "border-gray-300 hover:border-[#F85606]"
              }`}
            >
              {storage}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
