"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

interface ActionResult {
  ok: boolean;
  error?: string;
}

async function assertOwnsEvent(eventId: string, userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();
  return !!data;
}

const taskSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().trim().min(2, "Give the task a title").max(160),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee: z.string().trim().max(120).optional().or(z.literal("")),
});

export type TaskInput = z.infer<typeof taskSchema>;

export async function createTask(input: TaskInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage tasks." };

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task." };
  }

  if (!(await assertOwnsEvent(parsed.data.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("event_tasks").insert({
    event_id: parsed.data.eventId,
    title: parsed.data.title,
    notes: parsed.data.notes || null,
    due_date: parsed.data.dueDate || null,
    priority: parsed.data.priority,
    assignee: parsed.data.assignee || null,
    source: "manual",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/planner`);
  revalidatePath(`/dashboard/events/${parsed.data.eventId}`);
  return { ok: true };
}

export async function toggleTaskComplete(
  eventId: string,
  taskId: string,
  isComplete: boolean
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage tasks." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("event_tasks")
    .update({ is_complete: isComplete, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/events/${eventId}/planner`);
  revalidatePath(`/dashboard/events/${eventId}`);
  return { ok: true };
}

export async function deleteTask(eventId: string, taskId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage tasks." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("event_tasks").delete().eq("id", taskId).eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/events/${eventId}/planner`);
  revalidatePath(`/dashboard/events/${eventId}`);
  return { ok: true };
}
