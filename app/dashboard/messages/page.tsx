import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getConversationsForUser } from "@/lib/data/messaging";
import { MessagesShell } from "@/components/messaging/MessagesShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Messages" };

export default async function DashboardMessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const conversations = await getConversationsForUser(user.id);

  return (
    <MessagesShell conversations={conversations} basePath="/dashboard/messages">
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title="Select a conversation"
          description="Choose a conversation from the list, or message a vendor or venue from their profile to start one."
        />
      </div>
    </MessagesShell>
  );
}
