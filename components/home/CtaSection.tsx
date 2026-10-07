import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/site-settings-defaults";

export function CtaSection({ home }: { home: SiteSettings["home"] }) {
  return (
    <section className="py-16">
      <div className="container-page text-center">
        <h2 className="text-2xl sm:text-3xl">{home.cta_heading}</h2>
        {home.cta_body && <p className="mx-auto mt-2 max-w-md text-charcoal-400">{home.cta_body}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register">
            <Button size="lg">{home.cta_primary_label}</Button>
          </Link>
          <Link href="/ai-planner">
            <Button size="lg" variant="outline">{home.cta_secondary_label}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
