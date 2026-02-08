"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Upload,
  Sparkles,
  X,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from "@/components/products/ProductGrid";
import { Product } from "@/types";
import { toast } from "sonner";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [aiInsight, setAiInsight] = useState<string>("");

  const handleTextSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch("/api/ai-search/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await response.json();
      setResults(data.products || []);
      setAiInsight(data.insight || "");
    } catch {
      toast.error("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async () => {
    if (!imageFile) return;

    setLoading(true);
    setSearched(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await fetch("/api/ai-search/image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data.products || []);
      setAiInsight(data.insight || "");
    } catch {
      toast.error("Image search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-coral flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">AI Search</span>
      </nav>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <Sparkles className="inline w-7 h-7 text-coral mr-2" />
          AI-Powered Search
        </h1>
        <p className="text-gray-500">
          Describe what you want in natural language, or upload an image to find
          similar phones.
        </p>
      </div>

      {/* Search Modes */}
      <div className="max-w-2xl mx-auto mb-10">
        {/* Text Search */}
        <form onSubmit={handleTextSearch} className="mb-6">
          <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-coral">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try: "Android phone under R15k with good battery and 256GB storage"'
              className="flex-1 px-4 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 bg-coral text-white hover:bg-coral-dark transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </form>

        <div className="text-center text-gray-400 text-sm mb-6">
          — or search by image —
        </div>

        {/* Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-coral transition-colors">
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-48 mx-auto rounded-lg"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
              <Button
                onClick={handleImageSearch}
                disabled={loading}
                className="mt-4 bg-coral hover:bg-coral-dark text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Find Similar Phones
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Upload a phone image to find similar products
              </p>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, WEBP
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            <Sparkles className="w-4 h-4 inline mr-1" />
            {aiInsight}
          </p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="mt-8">
          <ProductGrid products={results} />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
