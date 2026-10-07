/**
 * Types + built-in defaults for admin-editable site content.
 * No server-only imports so both server code and (type-only) client
 * code can use it. The values here are what the site shows until an
 * admin saves something different from /admin/settings.
 */

export interface IconItem {
  icon: string;
  title: string;
  description: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterLink extends NavLink {
  /** Column heading the link is listed under (links with the same heading are grouped). */
  column: string;
}

export interface SiteSettings {
  navigation: {
    header_links: NavLink[];
    footer_links: FooterLink[];
  };
  legal: {
    privacy_title: string;
    privacy_body: string;
    terms_title: string;
    terms_body: string;
  };
  general: {
    site_name: string;
    tagline: string;
    footer_description: string;
    seo_description: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  home: {
    hero_badge: string;
    hero_title_1: string;
    hero_title_2: string;
    hero_subtitle: string;
    hero_primary_label: string;
    hero_secondary_label: string;
    show_categories: boolean;
    show_featured_events: boolean;
    show_featured_venues: boolean;
    show_featured_vendors: boolean;
    show_how_it_works: boolean;
    show_features: boolean;
    show_ai_promo: boolean;
    show_testimonials: boolean;
    show_cta: boolean;
    how_title: string;
    how_subtitle: string;
    how_steps: IconItem[];
    features_title: string;
    features_subtitle: string;
    features: IconItem[];
    ai_heading: string;
    ai_body: string;
    ai_button: string;
    testimonials_title: string;
    cta_heading: string;
    cta_body: string;
    cta_primary_label: string;
    cta_secondary_label: string;
  };
  pricing: {
    heading: string;
    subheading: string;
    footnote: string;
    tiers: PricingTier[];
  };
  platform: {
    maintenance_mode: boolean;
    maintenance_message: string;
    allow_registration: boolean;
  };
}

export type SettingsGroup = keyof SiteSettings;
export const SETTINGS_GROUPS: SettingsGroup[] = ["general", "contact", "home", "pricing", "platform", "navigation", "legal"];

const PRIVACY_DEFAULT = `This is a starting template — replace it with your own policy (ideally reviewed by a lawyer).

## What we collect
We collect the details you give us (name, email, phone), the events, bookings and messages you create, and basic usage data needed to run the service.

## How we use it
To provide and improve the platform, process bookings and payments, send service messages, and keep the platform safe.

## Sharing
We share information with venues, vendors and payment providers only as needed to complete your bookings. We do not sell your personal data.

## Your choices
You can update or delete your account information from your dashboard settings, or contact us to request removal.

## Contact
Questions about this policy? Use the Contact page.`;

const TERMS_DEFAULT = `This is a starting template — replace it with your own terms (ideally reviewed by a lawyer).

## Using the platform
You must provide accurate information and keep your account secure. You are responsible for activity on your account.

## Bookings and payments
Bookings are agreements between you and the venue, vendor or organizer. Payments are processed by our payment partners. Refund and cancellation rules are shown at checkout or set by the seller.

## Content
You are responsible for the content you post (listings, reviews, messages). We may remove content that is unlawful, misleading or abusive.

## Changes
We may update these terms. Continued use of the platform means you accept the updated terms.

## Contact
Questions about these terms? Use the Contact page.`;

export const DEFAULT_SETTINGS: SiteSettings = {
  navigation: {
    header_links: [
      { label: "Events", href: "/events" },
      { label: "Venues", href: "/venues" },
      { label: "Vendors", href: "/vendors" },
      { label: "AI Planner", href: "/ai-planner" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
    footer_links: [
      { column: "Plan", label: "AI Event Planner", href: "/ai-planner" },
      { column: "Plan", label: "Events", href: "/events" },
      { column: "Plan", label: "Venues", href: "/venues" },
      { column: "Plan", label: "Vendors", href: "/vendors" },
      { column: "Company", label: "Pricing", href: "/pricing" },
      { column: "Company", label: "Contact", href: "/contact" },
      { column: "Company", label: "Sell on Eventora", href: "/vendor/dashboard" },
      { column: "Account", label: "Sign In", href: "/auth/login" },
      { column: "Account", label: "Get Started", href: "/auth/register" },
      { column: "Account", label: "Dashboard", href: "/dashboard" },
    ],
  },
  legal: {
    privacy_title: "Privacy Policy",
    privacy_body: PRIVACY_DEFAULT,
    terms_title: "Terms of Service",
    terms_body: TERMS_DEFAULT,
  },
  general: {
    site_name: "Eventora",
    tagline: "Plan Less. Celebrate More.",
    footer_description:
      "Plan less, celebrate more — AI planning, venues, vendors, guests, budgets and tickets in one place.",
    seo_description:
      "Eventora is an all-in-one event management platform: AI planning, venues, vendors, guests, budgets, bookings and digital tickets in one place.",
  },
  contact: {
    email: "hello@eventora.example.com",
    phone: "+880 1XXX-XXXXXX",
    address: "Dhaka, Bangladesh",
    instagram: "",
    facebook: "",
    linkedin: "",
  },
  home: {
    hero_badge: "AI-powered event planning",
    hero_title_1: "Plan less.",
    hero_title_2: "Celebrate more.",
    hero_subtitle:
      "Eventora brings your AI planner, venues, vendors, guests, budget and tickets into one calm workspace — from first idea to the last dance.",
    hero_primary_label: "Create with AI",
    hero_secondary_label: "Explore Events",
    show_categories: true,
    show_featured_events: true,
    show_featured_venues: true,
    show_featured_vendors: true,
    show_how_it_works: true,
    show_features: true,
    show_ai_promo: true,
    show_testimonials: true,
    show_cta: true,
    how_title: "How Eventora works",
    how_subtitle: "From a rough idea to a fully booked event, in three steps.",
    how_steps: [
      {
        icon: "Sparkles",
        title: "Describe your event",
        description:
          "Tell the AI planner your event type, guest count, budget and date. It drafts a full blueprint in seconds.",
      },
      {
        icon: "Search",
        title: "Compare venues and vendors",
        description:
          "Review matched venues and vendors, request quotes, and message them directly — all in one thread.",
      },
      {
        icon: "CalendarCheck",
        title: "Manage and celebrate",
        description:
          "Track guests, budget and tasks on one timeline, then hand out digital tickets on the day.",
      },
    ],
    features_title: "Everything an organizer needs",
    features_subtitle: "One workspace instead of six spreadsheets and a group chat.",
    features: [
      { icon: "Wallet", title: "Smart budgeting", description: "Auto-allocated budgets by category, with live remaining balance." },
      { icon: "Users", title: "Guest management", description: "RSVPs, meal preferences, plus-ones and seating in one list." },
      { icon: "ListChecks", title: "Tasks & timeline", description: "A shared checklist with due dates so nothing slips through." },
      { icon: "MessageSquare", title: "Direct messaging", description: "Talk to venues and vendors without leaving your event." },
      { icon: "Ticket", title: "Digital tickets", description: "QR tickets for guests, scannable at the door." },
      { icon: "Star", title: "Verified reviews", description: "Ratings only from guests with a completed booking." },
    ],
    ai_heading: "Tell Eventora your event type, guest count and budget.",
    ai_body:
      "Get a personalized event plan — a budget breakdown, planning checklist, timeline and matched vendors — ready to act on, not just read.",
    ai_button: "Try the AI Planner",
    testimonials_title: "Loved by organizers and vendors",
    cta_heading: "Ready to start planning?",
    cta_body: "Create your first event in minutes — the AI planner does the heavy lifting.",
    cta_primary_label: "Get Started Free",
    cta_secondary_label: "Try AI Planner",
  },
  pricing: {
    heading: "Simple, transparent pricing",
    subheading: "Start for free. Upgrade whenever you need more — no hidden fees, cancel anytime.",
    footnote: "Prices shown in BDT. Need a custom plan for a large venue or agency?",
    tiers: [
      {
        name: "Free",
        price: "৳0",
        period: "forever",
        description: "For anyone planning their first event.",
        features: ["1 active event", "Guest & budget tracking", "AI Event Planner (basic)", "Browse venues & vendors"],
        cta: "Get Started",
        href: "/auth/register",
        featured: false,
      },
      {
        name: "Organizer",
        price: "৳990",
        period: "/ month",
        description: "For couples and organizers running a full event.",
        features: [
          "Unlimited events",
          "Full AI Event Planner",
          "Guest, budget & seating tools",
          "Direct messaging with vendors",
          "Digital tickets & QR check-in",
        ],
        cta: "Get Started",
        href: "/auth/register",
        featured: true,
      },
      {
        name: "Vendor",
        price: "৳1,490",
        period: "/ month",
        description: "For venues and vendors selling on Eventora.",
        features: [
          "Vendor storefront & portfolio",
          "Booking & calendar management",
          "Quote requests & messaging",
          "Earnings dashboard",
          "Verified customer reviews",
        ],
        cta: "Start Selling",
        href: "/vendor/dashboard",
        featured: false,
      },
    ],
  },
  platform: {
    maintenance_mode: false,
    maintenance_message: "We're making a few improvements and will be back shortly. Thank you for your patience!",
    allow_registration: true,
  },
};

/** Shallow-merge stored values over defaults for one group (arrays replace, never merge). */
export function mergeGroup<G extends SettingsGroup>(group: G, stored: unknown): SiteSettings[G] {
  const base = DEFAULT_SETTINGS[group];
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base;
  return { ...base, ...(stored as Partial<SiteSettings[G]>) };
}
