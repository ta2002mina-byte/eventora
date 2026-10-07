import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConversationsForUser, getConversationWithMessages } from "@/lib/data/messaging";
import { MessagesShell } from "@/components/messaging/MessagesShell";
import { MessageThread } from "@/components/messaging/MessageThread";
import { profileDisplayName } from "@/types/profile";

interface PageProps {
  params: { conversationId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Messages" };
  const conversation = await getConversationWithMessages(params.conversationId, user.id);
  if (!conversation) return { title: "Messages" };
  return { title: profileDisplayName(conversation.otherParticipant?.profile) };
}

export default async function DashboardMessageThreadPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [conversations, conversation] = await Promise.all([
    getConversationsForUser(user.id),
    getConversationWithMessages(params.conversationId, user.id),
  ]);

  if (!conversation) notFound();

  return (
    <MessagesShell
      conversations={conversations}
      basePath="/dashboard/messages"
      activeConversationId={conversation.id}
    >
      <MessageThread
        conversation={conversation}
        currentUserId={user.id}
        backHref="/dashboard/messages"
      />
    </MessagesShell>
  );
}
