import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

/**
 * Temporary placeholder used by routes scaffolded in Phase 01.
 * Each route below replaces this with real content in its own phase
 * (see PHASE comment on each page.tsx).
 */
export function PagePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Badge variant="gold" className="mb-4">
        <Sparkles className="h-3.5 w-3.5" />
        {phase}
      </Badge>
      <h1 className="text-3xl font-medium sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-charcoal-400">{description}</p>
    </main>
  );
}
