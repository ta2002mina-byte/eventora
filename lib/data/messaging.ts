import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProfilesByIds } from "@/lib/data/profiles";
import type {
  ConversationContextType,
  ConversationParticipantRecord,
  ConversationRecord,
  ConversationSummary,
  ConversationWithMessages,
  MessageRecord,
} from "@/types/messaging";
import { conversationContextLabel } from "@/types/messaging";
import type { Profile } from "@/types/profile";

interface ConversationRow extends ConversationRecord {
  conversation_participants: ConversationParticipantRecord[];
}

/** Resolves {context_type, context_id} pairs to a display name + link,
 * batched per type so an inbox of N conversations costs at most 3
 * extra queries (one per vendor/venue/event) instead of N. */
async function resolveContextLabels(
  conversations: ConversationRow[]
): Promise<Map<string, { label: string; href: string }>> {
  const result = new Map<string, { label: string; href: string }>();
  const supabase = createClient();

  const idsByType: Record<Exclude<ConversationContextType, "general">, string[]> = {
    vendor: [],
    venue: [],
    event: [],
  };
  for (const c of conversations) {
    if (c.context_type && c.context_type !== "general" && c.context_id) {
      idsByType[c.context_type].push(c.context_id);
    }
  }

  const [vendors, venues, events] = await Promise.all([
    idsByType.vendor.length
      ? supabase.from("vendors").select("id, business_name, slug").in("id", idsByType.vendor)
      : Promise.resolve({ data: [] as { id: string; business_name: string; slug: string }[] }),
    idsByType.venue.length
      ? supabase.from("venues").select("id, name, slug").in("id", idsByType.venue)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    idsByType.event.length
      ? supabase.from("events").select("id, title, slug").in("id", idsByType.event)
      : Promise.resolve({ data: [] as { id: string; title: string; slug: string }[] }),
  ]);

  for (const v of vendors.data ?? []) {
    result.set(`vendor:${v.id}`, { label: v.business_name, href: `/vendors/${v.slug}` });
  }
  for (const v of venues.data ?? []) {
    result.set(`venue:${v.id}`, { label: v.name, href: `/venues/${v.slug}` });
  }
  for (const e of events.data ?? []) {
    result.set(`event:${e.id}`, { label: e.title, href: `/events/${e.slug}` });
  }

  return result;
}

async function toSummaries(
  rows: ConversationRow[],
  userId: string
): Promise<ConversationSummary[]> {
  if (rows.length === 0) return [];

  const supabase = createClient();
  const otherUserIds = rows
    .map((c) => c.conversation_participants.find((p) => p.user_id !== userId)?.user_id)
    .filter((id): id is string => !!id);

  const [profiles, contextLabels, { data: unreadRows }] = await Promise.all([
    getProfilesByIds(otherUserIds),
    resolveContextLabels(rows),
    supabase.rpc("get_conversation_unread_counts", { p_user_id: userId }),
  ]);

  const unreadMap = new Map<string, number>();
  for (const r of (unreadRows ?? []) as { conversation_id: string; unread_count: number }[]) {
    unreadMap.set(r.conversation_id, Number(r.unread_count));
  }

  return rows.map((c) => {
    const participants = c.conversation_participants.map((p) => ({
      ...p,
      profile: profiles.get(p.user_id) ?? null,
    }));
    const other = participants.find((p) => p.user_id !== userId) ?? null;
    const contextKey = c.context_id && c.context_type ? `${c.context_type}:${c.context_id}` : null;
    const context = contextKey ? contextLabels.get(contextKey) : undefined;

    return {
      ...c,
      participants,
      otherParticipant: other,
      unreadCount: unreadMap.get(c.id) ?? 0,
      contextLabel: context?.label ?? (c.context_type ? conversationContextLabel(c.context_type) : null),
      contextHref: context?.href ?? null,
    };
  });
}

/** All of the signed-in user's conversations, newest activity first.
 * RLS (`is_conversation_participant`) already scopes this to the
 * caller's own threads. */
export async function getConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, conversation_participants(*)")
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("getConversationsForUser:", error.message);
    return [];
  }

  return toSummaries((data ?? []) as unknown as ConversationRow[], userId);
}

/** One thread with its full message history. Returns null if the
 * conversation doesn't exist or the user isn't a participant (RLS
 * makes both cases look identical, which is the correct behavior —
 * no leaking which conversation ids exist). */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  const supabase = createClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*, conversation_participants(*)")
    .eq("id", conversationId)
    .maybeSingle();

  if (convError) {
    console.error("getConversationWithMessages:", convError.message);
    return null;
  }
  if (!conversation) return null;

  const [summary] = await toSummaries([conversation as unknown as ConversationRow], userId);

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*, message_attachments(*)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("getConversationWithMessages (messages):", msgError.message);
    return { ...summary, messages: [] };
  }

  return { ...summary, messages: (messages ?? []) as MessageRecord[] };
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_conversation_unread_counts", {
    p_user_id: userId,
  });
  if (error) {
    console.error("getUnreadMessageCount:", error.message);
    return 0;
  }
  return ((data ?? []) as { unread_count: number }[]).reduce(
    (sum, r) => sum + Number(r.unread_count),
    0
  );
}

export type { Profile };
