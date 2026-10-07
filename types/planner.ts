/**
 * Types for Phase 06 — Event Creation + AI Event Planner.
 * A "planning event" is a row in the same `events` table used by the
 * Phase 03 marketplace, just private/draft and owned by the current
 * user (see EventRecord in types/event.ts for the full shape).
 */

export const EVENT_TYPE_OPTIONS = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "concert", label: "Concert" },
  { value: "conference", label: "Conference" },
  { value: "graduation", label: "Graduation" },
  { value: "other", label: "Other" },
] as const;

export type EventTaskPriority = "low" | "medium" | "high";
export type EventTaskSource = "manual" | "ai";

export interface EventTaskRecord {
  id: string;
  event_id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: EventTaskPriority;
  assignee: string | null;
  is_complete: boolean;
  source: EventTaskSource;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------
// AI Event Planner
// ------------------------------------------------------------------

export interface AiPlanInput {
  eventType: string;
  location?: string;
  guestCount?: number;
  budget?: number;
  eventDate?: string;
  theme?: string;
  venuePreference?: string;
  requirements?: string;
  notes?: string;
}

export interface AiBudgetAllocationItem {
  category: string;
  percentage: number;
  amount: number;
  notes?: string;
}

export interface AiChecklistItem {
  title: string;
  description?: string;
}

export interface AiTimelineItem {
  label: string; // e.g. "8 weeks before"
  dueDate?: string; // ISO date, when an eventDate was provided
  title: string;
  description?: string;
}

export interface AiVenueRequirement {
  label: string;
  value: string;
}

export interface AiVendorCategory {
  category: string; // matches vendor category slug where possible
  label: string;
  priority: "essential" | "recommended" | "optional";
  notes?: string;
}

export interface AiVendorRecommendation {
  category: string;
  title: string;
  description: string;
  criteria: { city?: string; maxPrice?: number };
}

export interface AiVenueRecommendation {
  title: string;
  description: string;
  criteria: { city?: string; minCapacity?: number; maxPrice?: number };
}

export interface AiPlanResult {
  overview: string;
  budgetAllocation: AiBudgetAllocationItem[];
  checklist: AiChecklistItem[];
  timeline: AiTimelineItem[];
  venueRequirements: AiVenueRequirement[];
  vendorCategories: AiVendorCategory[];
  vendorRecommendations: AiVendorRecommendation[];
  venueRecommendations: AiVenueRecommendation[];
  guestChecklist: AiChecklistItem[];
  importantTasks: AiChecklistItem[];
}

export interface AiEventPlanRecord {
  id: string;
  user_id: string;
  event_id: string | null;
  event_type: string;
  location: string | null;
  guest_count: number | null;
  budget: number | null;
  event_date: string | null;
  theme: string | null;
  venue_preference: string | null;
  requirements: string | null;
  notes: string | null;
  provider: string;
  overview: string;
  result: AiPlanResult;
  budget_applied_at: string | null;
  tasks_applied_at: string | null;
  created_at: string;
}

/** Result returned to the client by the generatePlan server action. */
export interface GeneratePlanResult {
  ok: boolean;
  error?: string;
  plan?: AiPlanResult;
  planId?: string | null; // null when not persisted (signed-out preview)
}
