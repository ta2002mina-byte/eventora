"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { startConversation } from "@/app/dashboard/messages/actions";
import type { ConversationContextType, ConversationRole } from "@/types/messaging";

export function StartConversationButton({
  isAuthenticated,
  contextType,
  contextId,
  recipientId,
  recipientRole,
  recipientName,
  label = "Message",
  basePath = "/dashboard/messages",
  className,
}: {
  isAuthenticated: boolean;
  contextType: ConversationContextType;
  contextId: string;
  recipientId: string | null;
  recipientRole: ConversationRole;
  recipientName: string;
  label?: string;
  /** Where to land after the first message sends — defaults to the
   * customer inbox; pass "/vendor/dashboard/messages" when this
   * button is rendered for a vendor's own view of a thread. */
  basePath?: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" className={className} leftIcon={<MessageCircle className="h-4 w-4" />}>
          Sign in to Message
        </Button>
      </Link>
    );
  }

  if (!recipientId) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const result = await startConversation({
      contextType,
      contextId,
      recipientId: recipientId!,
      recipientRole,
      subject: recipientName,
      message: trimmed,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.conversationId) {
      toast({ variant: "error", title: "Couldn't send message", description: result.error });
      return;
    }

    setOpen(false);
    setMessage("");
    toast({ variant: "success", title: "Message sent" });
    router.push(`${basePath}/${result.conversationId}`);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        leftIcon={<MessageCircle className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Message ${recipientName}`}
        description="Start a conversation — they'll reply from their inbox."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            autoFocus
            rows={4}
            placeholder={`Hi ${recipientName}, ...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!message.trim()}>
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
