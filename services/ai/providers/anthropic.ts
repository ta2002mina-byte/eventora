import "server-only";
import type { AiProvider } from "@/services/ai/provider";
import type { AiPlanInput, AiPlanResult } from "@/types/planner";
import { ruleBasedAiProvider } from "@/services/ai/providers/rule-based";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

function buildPrompt(input: AiPlanInput) {
  return `You are Eventora's AI Event Planner. Generate a structured event plan as JSON only —
no prose, no markdown fences, no preamble.

Event inputs:
- Event type: ${input.eventType}
- Location: ${input.location ?? "not specified"}
- Guest count: ${input.guestCount ?? "not specified"}
- Budget: ${input.budget ? `${input.budget} BDT` : "not specified"}
- Date: ${input.eventDate ?? "not specified"}
- Theme: ${input.theme ?? "not specified"}
- Venue preference: ${input.venuePreference ?? "not specified"}
- Requirements: ${input.requirements ?? "none"}
- Notes: ${input.notes ?? "none"}

Return a single JSON object matching exactly this TypeScript shape (fill every field,
use empty arrays if genuinely not applicable, use BDT currency for amounts):

{
  "overview": string,
  "budgetAllocation": { "category": string, "percentage": number, "amount": number, "notes"?: string }[],
  "checklist": { "title": string, "description"?: string }[],
  "timeline": { "label": string, "dueDate"?: string, "title": string, "description"?: string }[],
  "venueRequirements": { "label": string, "value": string }[],
  "vendorCategories": { "category": string, "label": string, "priority": "essential"|"recommended"|"optional", "notes"?: string }[],
  "vendorRecommendations": { "category": string, "title": string, "description": string, "criteria": { "city"?: string, "maxPrice"?: number } }[],
  "venueRecommendations": { "title": string, "description": string, "criteria": { "city"?: string, "minCapacity"?: number, "maxPrice"?: number } }[],
  "guestChecklist": { "title": string, "description"?: string }[],
  "importantTasks": { "title": string, "description"?: string }[]
}`;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export const anthropicAiProvider: AiProvider = {
  name: "anthropic",

  async generatePlan(input: AiPlanInput): Promise<AiPlanResult> {
    const apiKey = process.env.AI_PROVIDER_API_KEY;
    if (!apiKey) {
      // No key configured — fall back to the deterministic provider
      // rather than failing the request.
      return ruleBasedAiProvider.generatePlan(input);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          messages: [{ role: "user", content: buildPrompt(input) }],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI provider request failed (${response.status})`);
      }

      const data = await response.json();
      const text = (data.content ?? [])
        .map((block: { type: string; text?: string }) => (block.type === "text" ? block.text ?? "" : ""))
        .join("\n");

      const parsed = extractJson(text) as AiPlanResult;
      if (!parsed || !Array.isArray(parsed.budgetAllocation)) {
        throw new Error("AI provider returned an unexpected shape");
      }
      return parsed;
    } catch (err) {
      console.error("anthropicAiProvider.generatePlan:", err);
      // Never surface a broken plan to the user — degrade gracefully.
      return ruleBasedAiProvider.generatePlan(input);
    }
  },
};
