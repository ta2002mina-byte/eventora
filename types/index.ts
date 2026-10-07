/**
 * Shared application types.
 * Extend this file (or split by domain, e.g. types/event.ts)
 * as Supabase tables are introduced in later phases.
 */

export type UserRole = "customer" | "vendor" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };
