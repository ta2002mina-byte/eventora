import "server-only";
import type { AiProvider } from "@/services/ai/provider";
import { ruleBasedAiProvider } from "@/services/ai/providers/rule-based";
import { anthropicAiProvider } from "@/services/ai/providers/anthropic";

/**
 * Active provider is chosen at request time via AI_PROVIDER (server env,
 * never exposed to the client). Defaults to the deterministic rule-based
 * provider so the AI Planner works out of the box with no API key.
 * Set AI_PROVIDER=anthropic + AI_PROVIDER_API_KEY to use a real model.
 */
export function getAiProvider(): AiProvider {
  const selected = (process.env.AI_PROVIDER ?? "rule-based").toLowerCase();
  switch (selected) {
    case "anthropic":
      return anthropicAiProvider;
    case "rule-based":
    default:
      return ruleBasedAiProvider;
  }
}

export type { AiProvider } from "@/services/ai/provider";
