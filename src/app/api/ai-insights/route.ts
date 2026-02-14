import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai/client";

export async function POST(req: NextRequest) {
  try {
    const metrics = await req.json();

    // Graceful fallback if no API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        summary:
          "AI Insights are unavailable — configure OPENAI_API_KEY in your environment to enable this feature.\n\nIn the meantime, here's what the data shows at a glance:\n• Total Revenue: R" +
          (metrics.totalRevenue ?? 0).toLocaleString() +
          "\n• Gross Profit Margin: " +
          (metrics.profitMargin ?? 0).toFixed(1) +
          "%\n• " +
          (metrics.totalOrders ?? 0) +
          " orders from " +
          (metrics.totalCustomers ?? 0) +
          " customers.",
      });
    }

    // Build a compact data summary for the prompt
    const dataBlock = JSON.stringify(
      {
        totalRevenue: metrics.totalRevenue,
        totalCost: metrics.totalCost,
        grossProfit: metrics.grossProfit,
        profitMargin: metrics.profitMargin,
        totalOrders: metrics.totalOrders,
        avgOrderValue: metrics.avgOrderValue,
        paymentBreakdown: metrics.paymentBreakdown,
        revenueByPayment: metrics.revenueByPayment,
        topSellingProducts: metrics.topSellingProducts,
        mostViewedProducts: metrics.mostViewedProducts,
        categoryData: metrics.categoryData,
        totalCustomers: metrics.totalCustomers,
        topCustomers: metrics.topCustomers?.slice(0, 5),
        demographics: metrics.demographics,
      },
      null,
      2
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a senior business analyst for TechNest, an online mobile phone store in South Africa (prices in ZAR, prefixed with R).

You will receive a JSON object containing the store's current performance metrics. Analyze the data and produce a concise executive summary.

Rules:
- Write 4-6 bullet points covering the most important insights (revenue health, product performance, customer behavior, category trends).
- End with 1-2 actionable recommendations the admin should consider.
- Use plain language, be specific with numbers (e.g. "R12,500" not "twelve thousand five hundred").
- Do NOT use markdown headers or bold — just bullet points (•) and plain text.
- Keep the entire response under 250 words.`,
        },
        {
          role: "user",
          content: `Here is the current store performance data:\n\n${dataBlock}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const summary =
      completion.choices[0]?.message?.content?.trim() ??
      "Unable to generate insights at this time.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI Insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights", summary: "An error occurred while generating AI insights. Please try again." },
      { status: 500 }
    );
  }
}
