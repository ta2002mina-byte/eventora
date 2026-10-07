"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ConversationContextType, ConversationRole } from "@/types/messaging";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const startConversationSchema = z.object({
  contextType: z.enum(["vendor", "venue", "event", "general"]),
  contextId: z.string().uuid().optional(),
  recipientId: z.string().uuid(),
  recipientRole: z.enum(["customer", "vendor", "venue", "organizer"]).default("vendor"),
  subject: z.string().max(160).optional(),
  message: z.string().trim().min(1, "Write a message first").max(2000),
});

export interface StartConversationInput {
  contextType: ConversationContextType;
  contextId?: string;
  recipientId: string;
  recipientRole?: ConversationRole;
  subject?: string;
  message: string;
}

export interface StartConversationResult extends ActionResult {
  conversationId?: string;
}

/** Starts (or reuses) a conversation and sends the first message, via
 * the `start_conversation` RPC so the multi-table write is atomic. */
export async function startConversation(
  input: StartConversationInput
): Promise<StartConversationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to send a message." };

  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_conversation", {
    p_context_type: parsed.data.contextType,
    p_context_id: parsed.data.contextId ?? null,
    p_recipient_id: parsed.data.recipientId,
    p_recipient_role: parsed.data.recipientRole,
    p_subject: parsed.data.subject ?? null,
    p_message: parsed.data.message,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/messages");
  revalidatePath("/vendor/dashboard/messages");
  return { ok: true, conversationId: data as string };
}

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, "Type a message first").max(2000),
});

/** Sends a message into an existing thread. RLS enforces that the
 * caller is a participant — no need to re-check membership here. */
export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to send a message." };

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/messages/${parsed.data.conversationId}`);
  revalidatePath(`/vendor/dashboard/messages/${parsed.data.conversationId}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/vendor/dashboard/messages");
  return { ok: true };
}

/** Marks a thread as read up to now for the signed-in user. */
export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/messages");
  revalidatePath("/vendor/dashboard/messages");
  return { ok: true };
}
