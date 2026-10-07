"use client";

import * as React from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/app/dashboard/messages/actions";
import { profileDisplayName, profileInitials } from "@/types/profile";
import type { ConversationWithMessages, MessageRecord } from "@/types/messaging";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}


export function MessageThread({
  conversation,
  currentUserId,
  backHref,
}: {
  conversation: ConversationWithMessages;
  currentUserId: string;
  backHref?: string;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<MessageRecord[]>(conversation.messages);
  const [body, setBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const seenIds = React.useRef(new Set(conversation.messages.map((m) => m.id)));

  const otherName = profileDisplayName(conversation.otherParticipant?.profile);
  const otherInitials = profileInitials(conversation.otherParticipant?.profile);

  React.useEffect(() => {
    setMessages(conversation.messages);
    seenIds.current = new Set(conversation.messages.map((m) => m.id));
  }, [conversation.id, conversation.messages]);

  // Mark read on open and whenever new messages arrive while the
  // thread is in view.
  React.useEffect(() => {
    markConversationRead(conversation.id).catch(() => {});
  }, [conversation.id, messages.length]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Prefer Supabase Realtime for new messages; fall back to a plain
  // polling refresh if the channel never subscribes (e.g. Realtime
  // isn't enabled on this project/table yet).
  React.useEffect(() => {
    const supabase = createClient();
    let usingRealtime = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRecord;
          if (seenIds.current.has(incoming.id)) return;
          seenIds.current.add(incoming.id);
          setMessages((prev) => [...prev, incoming]);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          usingRealtime = true;
          if (pollId) {
            clearInterval(pollId);
            pollId = undefined;
          }
        }
      });

    // If we haven't confirmed a realtime subscription shortly after
    // mount, poll for new messages instead.
    const fallbackTimer = setTimeout(() => {
      if (usingRealtime) return;
      pollId = setInterval(async () => {
        const { data } = await supabase
          .from("messages")
          .select("*, message_attachments(*)")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });
        if (!data) return;
        const fresh = (data as MessageRecord[]).filter((m) => !seenIds.current.has(m.id));
        if (fresh.length === 0) return;
        fresh.forEach((m) => seenIds.current.add(m.id));
        setMessages((prev) => [...prev, ...fresh]);
      }, 6000);
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      if (pollId) clearInterval(pollId);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSending) return;

    const optimistic: MessageRecord = {
      id: `optimistic-${crypto.randomUUID()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      edited_at: null,
    };
    seenIds.current.add(optimistic.id);
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    setIsSending(true);

    const result = await sendMessage({ conversationId: conversation.id, body: trimmed });
    setIsSending(false);

    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setBody(trimmed);
      toast({ variant: "error", title: "Couldn't send", description: result.error });
    }
  }

  let lastDay = "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-100 text-xs font-medium text-purple-700">
          {otherInitials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-charcoal">{otherName}</p>
          {conversation.contextLabel && (
            <p className="truncate text-xs text-charcoal-400">{conversation.contextLabel}</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          const dayLabel = formatDayLabel(message.created_at);
          const showDivider = dayLabel !== lastDay;
          lastDay = dayLabel;

          return (
            <React.Fragment key={message.id}>
              {showDivider && (
                <div className="flex justify-center">
                  <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs text-charcoal-400">
                    {dayLabel}
                  </span>
                </div>
              )}
              <div className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    mine
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-purple-700 px-4 py-2.5 text-sm text-warmwhite sm:max-w-[65%]"
                      : "max-w-[80%] rounded-2xl rounded-bl-sm bg-charcoal/5 px-4 py-2.5 text-sm text-charcoal sm:max-w-[65%]"
                  }
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                  <p
                    className={
                      mine
                        ? "mt-1 text-right text-[10px] text-warmwhite/70"
                        : "mt-1 text-right text-[10px] text-charcoal-400"
                    }
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled
            title="Attachments arrive with Supabase Storage uploads"
            aria-label="Attach a file"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-charcoal-300"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={1}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal-400 focus:border-purple-500 focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            className="h-11 w-11 shrink-0 rounded-full p-0"
            isLoading={isSending}
            disabled={!body.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
