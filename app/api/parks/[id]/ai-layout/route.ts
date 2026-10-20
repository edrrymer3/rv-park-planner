import { NextResponse } from "next/server";
import { generateLayoutSuggestion } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acreage, goals, phaseCount = 2, avgNightlyRate = 45 } = body;

    if (!acreage || acreage <= 0) {
      return NextResponse.json({ error: "Acreage is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_anthropic_api_key_here") {
      // Return a realistic mock when no API key configured
      const totalSites = Math.round(acreage * 8);
      const pullThroughCount = Math.round(totalSites * 0.4);
      const backInCount = totalSites - pullThroughCount;
      const sitesPerPhase = Math.ceil(totalSites / phaseCount);

      return NextResponse.json({
        totalSites,
        pullThroughCount,
        backInCount,
        pullThroughRatio: 40,
        roadWidthFt: 24,
        utilityRunRecommendation:
          "Run water and sewer mains along the main entrance road, with electric pedestals at each row. Install a central utility loop for phases 2+.",
        layoutNotes:
          `For ${acreage} acres, recommend a loop road design with pull-throughs along the perimeter and back-ins in interior rows. ` +
          `Reserve 15% of acreage for roads, amenities, and green space.`,
        phases: Array.from({ length: phaseCount }, (_, i) => ({
          name: `Phase ${i + 1}`,
          siteCount: i < phaseCount - 1 ? sitesPerPhase : totalSites - sitesPerPhase * i,
          description:
            i === 0
              ? "Core loop with entrance road, dump station, and primary utility hookups"
              : `Expansion with ${i === 1 ? "premium pull-through" : "back-in"} sites and additional amenities`,
          estimatedRevenue: Math.round(
            sitesPerPhase * avgNightlyRate * 0.65 * 365
          ),
        })),
        _mock: true,
      });
    }

    const suggestion = await generateLayoutSuggestion({
      acreage,
      goals: goals || "maximize revenue, family-friendly",
      phaseCount,
      avgNightlyRate,
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("AI layout error:", error);
    return NextResponse.json(
      { error: "Failed to generate layout suggestion" },
      { status: 500 }
    );
  }
}
