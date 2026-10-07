import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/auth";
import { AiPlannerForm } from "@/components/planner/AiPlannerForm";

export const metadata: Metadata = {
  title: "AI Event Planner",
  description:
    "Tell Eventora your event type, guest count and budget, and get a personalized event plan with budget, timeline, venue and vendor recommendations.",
};

export default async function AiPlannerPage() {
  const user = await getCurrentUser();

  return (
    <main className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="gold" className="mx-auto mb-4 w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          AI Event Planner
        </Badge>
        <h1 className="text-3xl font-medium sm:text-4xl">Plan Less. Celebrate More.</h1>
        <p className="mt-3 text-charcoal-400">
          Tell Eventora your event type, guest count and budget. Get a personalized event
          plan — try something like{" "}
          <span className="text-charcoal">&ldquo;500 guest wedding in Dhaka with a budget of 8 lakh BDT.&rdquo;</span>
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <AiPlannerForm isAuthenticated={!!user} />
      </div>
    </main>
  );
}
