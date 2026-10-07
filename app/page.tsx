import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedEvents } from "@/components/home/FeaturedEvents";
import { FeaturedVenues } from "@/components/home/FeaturedVenues";
import { FeaturedVendors } from "@/components/home/FeaturedVendors";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PlanningFeatures } from "@/components/home/PlanningFeatures";
import { AIPromo } from "@/components/home/AIPromo";
import { Testimonials } from "@/components/home/Testimonials";
import { CtaSection } from "@/components/home/CtaSection";
import { getSiteSettings } from "@/lib/site-settings";

export default async function HomePage() {
  const { home } = await getSiteSettings();
  return (
    <main>
      <Hero home={home} />
      {home.show_categories && <CategoryGrid />}
      {home.show_featured_events && <FeaturedEvents />}
      {home.show_featured_venues && <FeaturedVenues />}
      {home.show_featured_vendors && <FeaturedVendors />}
      {home.show_how_it_works && <HowItWorks home={home} />}
      {home.show_features && <PlanningFeatures home={home} />}
      {home.show_ai_promo && <AIPromo home={home} />}
      {home.show_testimonials && <Testimonials title={home.testimonials_title} />}
      {home.show_cta && <CtaSection home={home} />}
    </main>
  );
}
