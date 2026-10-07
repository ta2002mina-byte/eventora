import "server-only";
import type { AiPlanInput, AiPlanResult } from "@/types/planner";

/**
 * Provider-agnostic AI Event Planner interface. Every provider under
 * services/ai/providers/* implements this so app code never depends
 * on a specific vendor. Select the active provider via services/ai/index.ts.
 */
export interface AiProvider {
  readonly name: string;
  generatePlan(input: AiPlanInput): Promise<AiPlanResult>;
}
