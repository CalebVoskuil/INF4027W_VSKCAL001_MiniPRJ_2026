import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai/client";
import { getProducts } from "@/lib/firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback: return all products
      const products = await getProducts([]);
      return NextResponse.json({
        products: products.slice(0, 8),
        insight: "Image search requires OPENAI_API_KEY. Showing all products.",
      });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";

    // Analyze image with GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify this mobile phone from the image. Return a JSON object ONLY (no markdown):
{
  "brand": "brand name or 'unknown'",
  "estimatedModel": "model name or 'unknown'",
  "color": "dominant color",
  "visualFeatures": ["feature1", "feature2"],
  "category": "budget" | "midrange" | "flagship",
  "summary": "brief description of the phone identified"
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    let analysis;
    try {
      const content = response.choices[0].message.content ?? "{}";
      analysis = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      analysis = {
        brand: "unknown",
        estimatedModel: "unknown",
        category: "midrange",
        summary: "Could not identify the phone",
      };
    }

    // Query similar products
    let products = await getProducts([]);

    if (analysis.brand && analysis.brand !== "unknown") {
      const brandProducts = products.filter(
        (p) => p.brand.toLowerCase() === analysis.brand.toLowerCase()
      );
      if (brandProducts.length > 0) {
        products = brandProducts;
      }
    }

    if (analysis.category) {
      const catProducts = products.filter((p) => p.category === analysis.category);
      if (catProducts.length > 0) {
        products = catProducts;
      }
    }

    return NextResponse.json({
      products: products.slice(0, 8),
      analysis,
      insight: analysis.summary || `Identified: ${analysis.brand} ${analysis.estimatedModel}. Showing similar products.`,
    });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { error: "Image search failed", products: [], insight: "" },
      { status: 500 }
    );
  }
}
