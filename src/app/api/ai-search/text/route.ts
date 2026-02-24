import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai/client";
import { getProducts } from "@/lib/firebase/firestore";
import { Product } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ products: [], insight: "" });
    }

    // If no OpenAI key, fall back to simple text matching
    if (!process.env.OPENAI_API_KEY) {
      const allProducts = await getProducts([]);
      const searchLower = query.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.model.toLowerCase().includes(searchLower) ||
          p.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
          p.specs.os.toLowerCase().includes(searchLower)
      );
      return NextResponse.json({
        products: filtered.slice(0, 10),
        insight: "Showing text-matched results. Configure OPENAI_API_KEY for AI-powered search.",
      });
    }

    // Extract search criteria using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a mobile phone search assistant. Extract search criteria from user queries.
Return a JSON object ONLY (no markdown, no explanation):
{
  "brands": [],
  "os": null,
  "maxPrice": null,
  "minPrice": null,
  "minRam": null,
  "minStorage": null,
  "minBattery": null,
  "category": null,
  "priorities": [],
  "summary": "brief description of what the user wants"
}
- brands: array of brand names (Samsung, Apple, Xiaomi, Google, OnePlus, etc.)
- os: "Android" or "iOS" or null
- maxPrice/minPrice: numbers in ZAR (South African Rand), null if not specified
- minRam: minimum RAM in GB as number, null if not specified
- minStorage: minimum storage in GB as number, null if not specified
- minBattery: minimum battery in mAh as number, null if not specified
- category: "budget" (under R6000), "midrange" (R6000-R15000), or "flagship" (over R15000), or null
- priorities: ordered list of what matters most, e.g. ["battery", "camera", "storage", "price"]
- summary: one sentence describing the user's needs`,
        },
        { role: "user", content: query },
      ],
      temperature: 0.3,
    });

    let criteria;
    try {
      const content = completion.choices[0].message.content ?? "{}";
      criteria = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      criteria = { brands: [], priorities: [], summary: "Could not parse search criteria" };
    }

    // Fetch all products and filter
    let products = await getProducts([]);

    // Apply filters
    if (criteria.brands?.length > 0) {
      products = products.filter((p) =>
        criteria.brands.some((b: string) => p.brand.toLowerCase() === b.toLowerCase())
      );
    }

    if (criteria.os) {
      products = products.filter((p) =>
        p.specs.os.toLowerCase().includes(criteria.os.toLowerCase())
      );
    }

    if (criteria.maxPrice) {
      products = products.filter((p) => p.price <= criteria.maxPrice);
    }

    if (criteria.minPrice) {
      products = products.filter((p) => p.price >= criteria.minPrice);
    }

    if (criteria.category) {
      products = products.filter((p) => p.category === criteria.category);
    }

    if (criteria.minRam) {
      products = products.filter((p) => parseInt(p.specs.ram) >= criteria.minRam);
    }

    if (criteria.minStorage) {
      products = products.filter((p) => parseInt(p.specs.storage) >= criteria.minStorage);
    }

    if (criteria.minBattery) {
      products = products.filter((p) => parseInt(p.specs.battery) >= criteria.minBattery);
    }

    // Rank by priorities
    if (criteria.priorities?.length > 0) {
      products = rankByPriority(products, criteria.priorities);
    }

    return NextResponse.json({
      products: products.slice(0, 12),
      criteria,
      insight: criteria.summary || `Found ${products.length} phones matching your criteria.`,
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { error: "Search failed", products: [], insight: "" },
      { status: 500 }
    );
  }
}

function rankByPriority(products: Product[], priorities: string[]): Product[] {
  return products.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    priorities.forEach((priority, index) => {
      const weight = priorities.length - index;

      switch (priority.toLowerCase()) {
        case "battery":
          scoreA += parseInt(a.specs.battery) * weight;
          scoreB += parseInt(b.specs.battery) * weight;
          break;
        case "camera":
          scoreA += parseInt(a.specs.camera) * weight;
          scoreB += parseInt(b.specs.camera) * weight;
          break;
        case "storage":
          scoreA += parseInt(a.specs.storage) * weight;
          scoreB += parseInt(b.specs.storage) * weight;
          break;
        case "ram":
          scoreA += parseInt(a.specs.ram) * weight;
          scoreB += parseInt(b.specs.ram) * weight;
          break;
        case "price":
          // Lower price = higher score for price-conscious users
          scoreA += (50000 - a.price) * weight;
          scoreB += (50000 - b.price) * weight;
          break;
      }
    });

    return scoreB - scoreA;
  });
}
