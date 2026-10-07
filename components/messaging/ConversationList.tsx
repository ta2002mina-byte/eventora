"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { profileDisplayName } from "@/types/profile";
import type { ConversationSummary } from "@/types/messaging";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  basePath,
  activeConversationId,
  className,
}: {
  conversations: ConversationSummary[];
  basePath: string;
  activeConversationId?: string;
  className?: string;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      const name = profileDisplayName(c.otherParticipant?.profile).toLowerCase();
      return (
        name.includes(q) ||
        c.contextLabel?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q)
      );
    });
  }, [conversations, query]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-border p-3">
        <SearchBar placeholder="Search conversations" value={query} onChange={setQuery} />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No conversations yet"
            description="Messages you send or receive will show up here."
          />
        ) : filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-charcoal-400">
            No conversations match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                basePath={basePath}
                active={c.id === activeConversationId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
