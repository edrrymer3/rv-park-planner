import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface LayoutSuggestion {
  totalSites: number;
  pullThroughCount: number;
  backInCount: number;
  pullThroughRatio: number;
  roadWidthFt: number;
  utilityRunRecommendation: string;
  layoutNotes: string;
  phases: Array<{
    name: string;
    siteCount: number;
    description: string;
    estimatedRevenue?: number;
  }>;
}

export async function generateLayoutSuggestion(params: {
  acreage: number;
  goals: string;
  phaseCount: number;
  avgNightlyRate?: number;
}): Promise<LayoutSuggestion> {
  const { acreage, goals, phaseCount, avgNightlyRate = 45 } = params;

  const prompt = `You are an expert RV park layout consultant. An owner has ${acreage} acres and wants to develop an RV park.

Owner goals: ${goals}

Please provide a detailed layout recommendation in JSON format with these exact fields:
{
  "totalSites": <number - realistic site count for the acreage>,
  "pullThroughCount": <number>,
  "backInCount": <number>,
  "pullThroughRatio": <percentage 0-100>,
  "roadWidthFt": <number, typically 24-30>,
  "utilityRunRecommendation": "<string - where to run water/electric/sewer mains>",
  "layoutNotes": "<string - key design principles for this property>",
  "phases": [
    {
      "name": "Phase 1",
      "siteCount": <number>,
      "description": "<what to build in this phase and why>",
      "estimatedRevenue": <annual revenue at ${avgNightlyRate}/night, 65% occupancy>
    }
  ]
}

Use ${phaseCount} phases. Consider that RV sites typically need 30x70 ft for pull-throughs and 20x45 ft for back-ins, plus road space. Respond with only valid JSON, no markdown.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    return JSON.parse(content.text) as LayoutSuggestion;
  } catch {
    throw new Error("Failed to parse AI layout suggestion");
  }
}
