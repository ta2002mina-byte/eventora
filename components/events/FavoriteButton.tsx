"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { toggleFavorite } from "@/app/events/actions";

export function FavoriteButton({
  eventId,
  initialFavorited = false,
  className,
}: {
  eventId: string;
  initialFavorited?: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const optimistic = !favorited;
    setFavorited(optimistic);

    startTransition(async () => {
      const result = await toggleFavorite(eventId);
      if (!result.ok) {
        setFavorited(!optimistic);
        toast({
          variant: "error",
          title: result.error?.includes("Sign in") ? "Sign in required" : "Couldn't save",
          description: result.error ?? "Something went wrong. Try again.",
        });
        return;
      }
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from saved events" : "Save event"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal-600 shadow-softer backdrop-blur transition-colors hover:text-purple-700 disabled:opacity-60",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", favorited && "fill-purple-700 text-purple-700")} />
    </button>
  );
}
