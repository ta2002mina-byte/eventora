import { ConversationList } from "@/components/messaging/ConversationList";
import type { ConversationSummary } from "@/types/messaging";

export function MessagesShell({
  conversations,
  basePath,
  activeConversationId,
  children,
}: {
  conversations: ConversationSummary[];
  basePath: string;
  activeConversationId?: string;
  /** The thread pane — omit for the index route on mobile/desktop
   * empty state. */
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-0 sm:px-6 sm:py-6">
      <div className="grid h-full min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-none border-border bg-white sm:rounded-card sm:border sm:shadow-softer lg:grid-cols-[320px_1fr]">
        <div
          className={
            activeConversationId
              ? "hidden min-h-0 border-border lg:flex lg:border-r"
              : "flex min-h-0 border-border lg:border-r"
          }
        >
          <ConversationList
            conversations={conversations}
            basePath={basePath}
            activeConversationId={activeConversationId}
            className="w-full"
          />
        </div>
        <div className={activeConversationId ? "flex min-h-0" : "hidden min-h-0 lg:flex"}>
          {children}
        </div>
      </div>
    </main>
  );
}
