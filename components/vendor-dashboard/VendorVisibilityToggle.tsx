"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { setVendorStatus } from "@/app/vendor/dashboard/actions";
import type { VendorStatus } from "@/types/vendor";

export function VendorVisibilityToggle({ status }: { status: VendorStatus }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const isPublished = status === "published";

  async function handleToggle() {
    setPending(true);
    const result = await setVendorStatus(isPublished ? "draft" : "published");
    setPending(false);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update visibility", description: result.error });
      return;
    }
    toast({
      variant: "success",
      title: isPublished ? "Profile hidden from marketplace" : "Profile is now live",
    });
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-charcoal">Marketplace visibility</p>
          <Badge variant={isPublished ? "success" : "gray"}>{isPublished ? "Live" : "Draft"}</Badge>
        </div>
        <p className="mt-1 text-sm text-charcoal-400">
          {isPublished
            ? "Your profile is visible to customers on the Vendors marketplace."
            : "Your profile is hidden from customers until you publish it."}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        isLoading={pending}
        leftIcon={isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        onClick={handleToggle}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
}
