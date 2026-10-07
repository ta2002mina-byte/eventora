import { ICON_OPTIONS } from "@/lib/icon-names";
import type { Field } from "@/lib/admin/types";
import type { SettingsGroup } from "@/lib/site-settings-defaults";

const iconItem: Field[] = [
  { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS, required: true },
  { name: "title", label: "Title", type: "text", required: true, maxLength: 120 },
  { name: "description", label: "Description", type: "textarea", required: true, maxLength: 400 },
];

export const SETTINGS_TABS: { group: SettingsGroup; label: string; description: string }[] = [
  { group: "general", label: "General", description: "Site name, tagline and the text used in search results and the footer." },
  { group: "contact", label: "Contact & social", description: "Shown on the Contact page and in the footer." },
  { group: "home", label: "Homepage", description: "Hero text, every section's copy, and which sections are visible." },
  { group: "pricing", label: "Pricing", description: "The plans shown on the Pricing page." },
  { group: "navigation", label: "Menus & links", description: "The top navigation and the footer link columns." },
  { group: "legal", label: "Privacy & Terms", description: "The text of the /privacy and /terms pages. Use a blank line between paragraphs and start a line with ## for a heading." },
  { group: "platform", label: "Platform", description: "Maintenance mode and registration controls." },
];

export const SETTINGS_FIELDS: Record<SettingsGroup, Field[]> = {
  navigation: [
    {
      name: "header_links",
      label: "Top navigation links",
      type: "list",
      full: true,
      itemFields: [
        { name: "label", label: "Label", type: "text", required: true, maxLength: 30 },
        { name: "href", label: "Link", type: "text", required: true, maxLength: 200, placeholder: "/events" },
      ],
    },
    {
      name: "footer_links",
      label: "Footer links",
      type: "list",
      full: true,
      itemFields: [
        { name: "column", label: "Column heading", type: "text", required: true, maxLength: 30, hint: "Links with the same heading are grouped together." },
        { name: "label", label: "Label", type: "text", required: true, maxLength: 40 },
        { name: "href", label: "Link", type: "text", required: true, maxLength: 200, placeholder: "/pricing" },
      ],
    },
  ],
  legal: [
    { name: "privacy_title", label: "Privacy page title", type: "text", required: true, maxLength: 80 },
    { name: "privacy_body", label: "Privacy page text", type: "textarea", full: true, maxLength: 20000 },
    { name: "terms_title", label: "Terms page title", type: "text", required: true, maxLength: 80 },
    { name: "terms_body", label: "Terms page text", type: "textarea", full: true, maxLength: 20000 },
  ],
  general: [
    { name: "site_name", label: "Site name", type: "text", required: true, maxLength: 60 },
    { name: "tagline", label: "Tagline", type: "text", maxLength: 120, hint: "Used in the browser tab title." },
    { name: "footer_description", label: "Footer description", type: "textarea", full: true, maxLength: 300 },
    { name: "seo_description", label: "SEO / social description", type: "textarea", full: true, maxLength: 300 },
  ],
  contact: [
    { name: "email", label: "Public email", type: "email" },
    { name: "phone", label: "Phone", type: "text", maxLength: 40 },
    { name: "address", label: "Office address", type: "text", maxLength: 200, full: true },
    { name: "instagram", label: "Instagram URL", type: "url", hint: "Leave blank to hide the icon." },
    { name: "facebook", label: "Facebook URL", type: "url" },
    { name: "linkedin", label: "LinkedIn URL", type: "url" },
  ],
  home: [
    { name: "_h1", label: "Hero", type: "heading" },
    { name: "hero_badge", label: "Badge text", type: "text", maxLength: 80 },
    { name: "hero_title_1", label: "Headline (line 1)", type: "text", required: true, maxLength: 80 },
    { name: "hero_title_2", label: "Headline (line 2, highlighted)", type: "text", maxLength: 80 },
    { name: "hero_subtitle", label: "Subtitle", type: "textarea", full: true, maxLength: 300 },
    { name: "hero_primary_label", label: "Primary button label", type: "text", maxLength: 40 },
    { name: "hero_secondary_label", label: "Secondary button label", type: "text", maxLength: 40 },

    { name: "_h2", label: "Visible sections", type: "heading" },
    { name: "show_categories", label: "Browse by occasion (categories)", type: "boolean" },
    { name: "show_featured_events", label: "Featured events", type: "boolean" },
    { name: "show_featured_venues", label: "Featured venues", type: "boolean" },
    { name: "show_featured_vendors", label: "Featured vendors", type: "boolean" },
    { name: "show_how_it_works", label: "How it works", type: "boolean" },
    { name: "show_features", label: "Planning features", type: "boolean" },
    { name: "show_ai_promo", label: "AI Planner promo", type: "boolean" },
    { name: "show_testimonials", label: "Testimonials", type: "boolean" },
    { name: "show_cta", label: "Closing call-to-action", type: "boolean" },

    { name: "_h3", label: "How it works", type: "heading" },
    { name: "how_title", label: "Section title", type: "text", maxLength: 100 },
    { name: "how_subtitle", label: "Section subtitle", type: "text", maxLength: 200, full: true },
    { name: "how_steps", label: "Steps", type: "list", full: true, itemFields: iconItem },

    { name: "_h4", label: "Planning features", type: "heading" },
    { name: "features_title", label: "Section title", type: "text", maxLength: 100 },
    { name: "features_subtitle", label: "Section subtitle", type: "text", maxLength: 200, full: true },
    { name: "features", label: "Features", type: "list", full: true, itemFields: iconItem },

    { name: "_h5", label: "AI Planner promo", type: "heading" },
    { name: "ai_heading", label: "Heading", type: "text", maxLength: 160, full: true },
    { name: "ai_body", label: "Body", type: "textarea", full: true, maxLength: 400 },
    { name: "ai_button", label: "Button label", type: "text", maxLength: 40 },

    { name: "_h6", label: "Testimonials", type: "heading" },
    { name: "testimonials_title", label: "Section title", type: "text", maxLength: 100, hint: "The quotes themselves are managed under Testimonials." },

    { name: "_h7", label: "Closing call-to-action", type: "heading" },
    { name: "cta_heading", label: "Heading", type: "text", maxLength: 120 },
    { name: "cta_body", label: "Body", type: "text", maxLength: 240, full: true },
    { name: "cta_primary_label", label: "Primary button label", type: "text", maxLength: 40 },
    { name: "cta_secondary_label", label: "Secondary button label", type: "text", maxLength: 40 },
  ],
  pricing: [
    { name: "heading", label: "Page heading", type: "text", maxLength: 120, full: true },
    { name: "subheading", label: "Sub-heading", type: "textarea", maxLength: 300, full: true },
    {
      name: "tiers",
      label: "Plans",
      type: "list",
      full: true,
      itemFields: [
        { name: "name", label: "Plan name", type: "text", required: true, maxLength: 60 },
        { name: "price", label: "Price", type: "text", required: true, maxLength: 30, placeholder: "৳990" },
        { name: "period", label: "Period", type: "text", maxLength: 30, placeholder: "/ month" },
        { name: "description", label: "Description", type: "text", maxLength: 200 },
        { name: "features", label: "Features (one per line)", type: "lines" },
        { name: "cta", label: "Button label", type: "text", required: true, maxLength: 40 },
        { name: "href", label: "Button link", type: "text", required: true, maxLength: 200, placeholder: "/auth/register" },
        { name: "featured", label: "Highlight this plan", type: "boolean" },
      ],
    },
    { name: "footnote", label: "Footnote", type: "text", maxLength: 240, full: true },
  ],
  platform: [
    { name: "maintenance_mode", label: "Maintenance mode", type: "boolean", hint: "Visitors see a maintenance page. Admins, sign-in and /admin keep working." },
    { name: "maintenance_message", label: "Maintenance message", type: "textarea", full: true, maxLength: 300 },
    { name: "allow_registration", label: "Allow new sign-ups", type: "boolean", hint: "When off, the register page is closed. Existing users can still sign in." },
  ],
};
