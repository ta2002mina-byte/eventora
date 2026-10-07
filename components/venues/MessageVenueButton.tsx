"use client";

import { StartConversationButton } from "@/components/messaging/StartConversationButton";

/** Entry point for contacting a venue owner from the public venue page. */
export function MessageVenueButton({
  isAuthenticated,
  venueId,
  ownerId,
  venueName,
}: {
  isAuthenticated: boolean;
  venueId: string;
  ownerId: string | null;
  venueName: string;
}) {
  return (
    <StartConversationButton
      isAuthenticated={isAuthenticated}
      contextType="venue"
      contextId={venueId}
      recipientId={ownerId}
      recipientRole="venue"
      recipientName={venueName}
      label="Message Venue"
      className="w-full"
    />
  );
}
