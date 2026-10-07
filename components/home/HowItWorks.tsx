import { iconByName } from "@/lib/icons";
import type { SiteSettings } from "@/lib/site-settings-defaults";

export function HowItWorks({ home }: { home: SiteSettings["home"] }) {
  if (!home.how_steps?.length) return null;
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="mb-10 max-w-lg">
          <h2 className="text-2xl sm:text-3xl">{home.how_title}</h2>
          {home.how_subtitle && <p className="mt-2 text-charcoal-400">{home.how_subtitle}</p>}
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {home.how_steps.map((step, i) => {
            const Icon = iconByName(step.icon);
            return (
              <div key={`${step.title}-${i}`} className="relative pl-14">
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-purple-700 font-display text-base text-warmwhite">
                  {i + 1}
                </span>
                <Icon className="mb-3 h-5 w-5 text-gold-500" aria-hidden="true" />
                <h3 className="text-base font-medium text-charcoal">{step.title}</h3>
                <p className="mt-1.5 text-sm text-charcoal-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
