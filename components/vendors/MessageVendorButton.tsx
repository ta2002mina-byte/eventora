"use client";

import { StartConversationButton } from "@/components/messaging/StartConversationButton";

/** Entry point for contacting a vendor from their public profile. */
export function MessageVendorButton({
  isAuthenticated,
  vendorId,
  ownerId,
  businessName,
}: {
  isAuthenticated: boolean;
  vendorId: string;
  ownerId: string | null;
  businessName: string;
}) {
  return (
    <StartConversationButton
      isAuthenticated={isAuthenticated}
      contextType="vendor"
      contextId={vendorId}
      recipientId={ownerId}
      recipientRole="vendor"
      recipientName={businessName}
      label="Message Vendor"
      className="w-full"
    />
  );
}
