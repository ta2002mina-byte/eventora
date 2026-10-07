import Link from "next/link";
import { cn } from "@/lib/utils";
import { profileDisplayName, profileInitials } from "@/types/profile";
import type { ConversationSummary } from "@/types/messaging";

function formatTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

export function ConversationListItem({
  conversation,
  basePath,
  active,
}: {
  conversation: ConversationSummary;
  basePath: string;
  active?: boolean;
}) {
  const name = profileDisplayName(conversation.otherParticipant?.profile);
  const initials = profileInitials(conversation.otherParticipant?.profile);
  const unread = conversation.unreadCount > 0;

  return (
    <Link
      href={`${basePath}/${conversation.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
        active ? "bg-purple-50" : "hover:bg-charcoal/5"
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-sm font-medium text-purple-700">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm text-charcoal", unread ? "font-semibold" : "font-medium")}>
            {name}
          </span>
          <span className="shrink-0 text-xs text-charcoal-400">
            {formatTimestamp(conversation.last_message_at)}
          </span>
        </span>
        {conversation.contextLabel && (
          <span className="mt-0.5 block truncate text-xs text-purple-600">
            {conversation.contextLabel}
          </span>
        )}
        <span
          className={cn(
            "mt-0.5 block truncate text-sm",
            unread ? "font-medium text-charcoal" : "text-charcoal-400"
          )}
        >
          {conversation.last_message_preview ?? "No messages yet"}
        </span>
      </span>
      {unread && (
        <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-purple-700 px-1.5 text-[10px] font-semibold text-warmwhite">
          {conversation.unreadCount}
        </span>
      )}
    </Link>
  );
}
