import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 className={cn("h-5 w-5 animate-spin text-purple-600", className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
