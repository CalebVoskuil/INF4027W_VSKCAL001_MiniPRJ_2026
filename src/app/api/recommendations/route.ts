import { NextRequest, NextResponse } from "next/server";
import { getProductById, getProducts } from "@/lib/firebase/firestore";
import { where, limit } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Similar products: same category, price within ±20%
    const allProducts = await getProducts([
      where("category", "==", product.category),
      limit(10),
    ]);

    const priceMin = product.price * 0.8;
    const priceMax = product.price * 1.2;

    const similar = allProducts
      .filter((p) => p.id !== productId && p.price >= priceMin && p.price <= priceMax)
      .slice(0, 4);

    // Same brand products
    const sameBrand = allProducts
      .filter((p) => p.id !== productId && p.brand === product.brand)
      .slice(0, 4);

    return NextResponse.json({
      similar,
      sameBrand,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
