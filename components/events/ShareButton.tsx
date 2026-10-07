"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  async function onShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the native share sheet — no error needed.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ variant: "success", title: "Link copied", description: "Share it with your guests." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "error", title: "Couldn't copy link" });
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onShare}
      leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
    >
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
