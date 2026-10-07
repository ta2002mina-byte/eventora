import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/site-settings-defaults";


export function AIPromo({ home }: { home: SiteSettings["home"] }) {
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="grid items-center gap-10 rounded-card border border-border bg-gradient-to-br from-purple-700 to-purple-900 p-8 text-warmwhite sm:p-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> AI Event Planner
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl">
              {home.ai_heading}
            </h2>
            <p className="mt-3 max-w-md text-warmwhite/80">
              {home.ai_body}
            </p>
            <Link href="/ai-planner" className="mt-6 inline-block">
              <Button variant="secondary" leftIcon={<Sparkles className="h-4 w-4" />}>
                {home.ai_button}
              </Button>
            </Link>
          </div>

          <div className="rounded-card bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-warmwhite/70">You say:</p>
            <p className="mt-1.5 font-display text-lg italic">
              &ldquo;500 guest wedding in Dhaka with a budget of 8 lakh BDT.&rdquo;
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {["Budget allocation", "Planning checklist", "Timeline", "Vendor matches"].map(
                (item) => (
                  <div key={item} className="rounded-lg bg-white/10 px-3 py-2">
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
