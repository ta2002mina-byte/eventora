/**
 * Types for Phase 07 — Guest Management.
 */

export const RSVP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "invited", label: "Invited" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
] as const;

export type RsvpStatus = "pending" | "invited" | "confirmed" | "declined";

export interface GuestTableRecord {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  sort_order: number;
  created_at: string;
}

export interface GuestRecord {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group_name: string | null;
  rsvp_status: RsvpStatus;
  meal_preference: string | null;
  plus_one: boolean;
  plus_one_name: string | null;
  table_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestSummary {
  total: number;
  headcount: number; // guests + confirmed plus-ones
  pending: number;
  invited: number;
  confirmed: number;
  declined: number;
}

export function getGuestSummary(guests: GuestRecord[]): GuestSummary {
  const summary: GuestSummary = {
    total: guests.length,
    headcount: 0,
    pending: 0,
    invited: 0,
    confirmed: 0,
    declined: 0,
  };
  for (const g of guests) {
    summary[g.rsvp_status] += 1;
    if (g.rsvp_status === "confirmed") {
      summary.headcount += g.plus_one ? 2 : 1;
    }
  }
  return summary;
}
