import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely, resolving conflicts
 * (e.g. cn("p-2", isActive && "p-4") => "p-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe slug with a short random suffix to avoid collisions
 * (used for private dashboard events, which don't need a pretty/stable
 * public URL the way marketplace events do). */
export function slugify(value: string) {
  const base =
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "event";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
