import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai/client";
import { getProducts } from "@/lib/firebase/firestore";
import { Product } from "@/types";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are a friendly and knowledgeable shopping assistant for TechNest, a premium online mobile phone store in South Africa. Prices are in ZAR (South African Rand), prefixed with R.

Your job is to help customers find the perfect phone through natural conversation. You should:
1. Greet warmly and ask what they're looking for
2. Ask clarifying questions one or two at a time — budget range, preferred brand, Android vs iOS, what they use their phone for (photography, gaming, social media, business), any must-have specs
3. Be conversational, concise, and helpful — not robotic
4. When you have enough information to make recommendations, include a JSON criteria block in your response

IMPORTANT RESPONSE FORMAT:
- Always respond with a JSON object (no markdown, no code fences):
{
  "reply": "Your conversational message to the user",
  "criteria": null
}

- When you're ready to recommend phones, set criteria:
{
  "reply": "Your message explaining what you found and why these are good picks",
  "criteria": {
    "brands": [],
    "os": null,
    "maxPrice": null,
    "minPrice": null,
    "minRam": null,
    "minStorage": null,
    "minBattery": null,
    "category": null,
    "priorities": []
  }
}

Category definitions: "budget" (under R6,000), "midrange" (R6,000–R15,000), "flagship" (over R15,000).
Priorities can include: "battery", "camera", "storage", "ram", "price".

- You can set criteria multiple times if the user refines their needs.
- If the user asks something unrelated to phones, politely redirect them.
- Keep replies under 3 sentences when asking questions, and under 5 sentences when recommending.`;

function filterProducts(products: Product[], criteria: Record<string, unknown>): Product[] {
  let filtered = [...products];

  const brands = criteria.brands as string[] | undefined;
  if (brands && brands.length > 0) {
    filtered = filtered.filter((p) =>
      brands.some((b: string) => p.brand.toLowerCase() === b.toLowerCase())
    );
  }

  if (criteria.os) {
    filtered = filtered.filter((p) =>
      p.specs.os.toLowerCase().includes((criteria.os as string).toLowerCase())
    );
  }

  if (criteria.maxPrice) {
    filtered = filtered.filter((p) => p.price <= (criteria.maxPrice as number));
  }

  if (criteria.minPrice) {
    filtered = filtered.filter((p) => p.price >= (criteria.minPrice as number));
  }

  if (criteria.category) {
    filtered = filtered.filter((p) => p.category === criteria.category);
  }

  if (criteria.minRam) {
    filtered = filtered.filter((p) => parseInt(p.specs.ram) >= (criteria.minRam as number));
  }

  if (criteria.minStorage) {
    filtered = filtered.filter((p) => parseInt(p.specs.storage) >= (criteria.minStorage as number));
  }

  if (criteria.minBattery) {
    filtered = filtered.filter((p) => parseInt(p.specs.battery) >= (criteria.minBattery as number));
  }

  const priorities = criteria.priorities as string[] | undefined;
  if (priorities && priorities.length > 0) {
    filtered.sort((a, b) => {
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
            scoreA += (50000 - a.price) * weight;
            scoreB += (50000 - b.price) * weight;
            break;
        }
      });
      return scoreB - scoreA;
    });
  }

  return filtered;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Fallback if no OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        reply: "The AI assistant is currently unavailable. Please configure an OpenAI API key to enable this feature.",
        products: [],
      });
    }

    // Cap conversation history to last 20 messages to manage tokens
    const recentMessages = messages.slice(-20);

    // Fetch product catalog so the AI knows what's actually in stock
    const allProducts = await getProducts([]);
    const catalogLines = allProducts.map(
      (p) =>
        `- ${p.name} | R${p.price.toLocaleString()} | ${p.category} | ${p.specs.storage}, ${p.specs.ram} RAM, ${p.specs.battery} battery`
    );
    const catalogBlock = `\n\nAVAILABLE PRODUCTS IN STORE (only recommend from this list):\n${catalogLines.join("\n")}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + catalogBlock },
        ...recentMessages,
      ],
      temperature: 0.6,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    let reply = "";
    let criteria = null;

    // Resilient parsing: try full JSON first, then extract embedded JSON object
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

    let parsed = false;
    // Attempt 1: entire response is valid JSON
    try {
      const obj = JSON.parse(cleaned);
      if (obj.reply) {
        reply = obj.reply;
        criteria = obj.criteria || null;
        parsed = true;
      }
    } catch {
      // not valid JSON as a whole
    }

    // Attempt 2: extract the first { ... } JSON block from mixed text
    if (!parsed) {
      const jsonMatch = cleaned.match(/\{[\s\S]*"reply"\s*:\s*"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const obj = JSON.parse(jsonMatch[0]);
          reply = obj.reply || "";
          criteria = obj.criteria || null;
          parsed = true;
        } catch {
          // couldn't parse extracted block
        }
      }
    }

    // Attempt 3: strip any JSON-looking suffix and use the leading text as the reply
    if (!parsed) {
      const jsonStart = cleaned.indexOf("{");
      if (jsonStart > 0) {
        reply = cleaned.substring(0, jsonStart).trim();
        try {
          const obj = JSON.parse(cleaned.substring(jsonStart));
          criteria = obj.criteria || null;
        } catch {
          // ignore — at least we have the text portion as the reply
        }
      } else {
        reply = cleaned;
      }
    }

    let products: Product[] = [];

    if (criteria) {
      products = filterProducts(allProducts, criteria).slice(0, 4);
    }

    return NextResponse.json({ reply, products });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        reply: "Sorry, I ran into an issue. Please try again in a moment.",
        products: [],
      },
      { status: 500 }
    );
  }
}
