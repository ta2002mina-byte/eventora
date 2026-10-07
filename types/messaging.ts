import type { Profile } from "@/types/profile";

export type ConversationContextType = "vendor" | "venue" | "event" | "general";
export type ConversationRole = "customer" | "vendor" | "venue" | "organizer";

export interface ConversationRecord {
  id: string;
  context_type: ConversationContextType | null;
  context_id: string | null;
  subject: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
}

export interface ConversationParticipantRecord {
  conversation_id: string;
  user_id: string;
  role: ConversationRole;
  last_read_at: string | null;
  created_at: string;
}

export interface MessageAttachmentRecord {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  message_attachments?: MessageAttachmentRecord[];
}

/** A conversation enriched with what the inbox list needs to render
 * one row: the other participant(s) and this user's unread count. */
export interface ConversationSummary extends ConversationRecord {
  participants: (ConversationParticipantRecord & { profile: Profile | null })[];
  otherParticipant: (ConversationParticipantRecord & { profile: Profile | null }) | null;
  unreadCount: number;
  contextLabel: string | null;
  contextHref: string | null;
}

/** A single thread: the conversation plus its ordered messages. */
export interface ConversationWithMessages extends ConversationSummary {
  messages: MessageRecord[];
}

export function conversationContextLabel(
  contextType: ConversationContextType | null
): string {
  switch (contextType) {
    case "vendor":
      return "Vendor";
    case "venue":
      return "Venue";
    case "event":
      return "Event";
    default:
      return "General";
  }
}
