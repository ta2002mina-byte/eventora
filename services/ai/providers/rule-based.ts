import "server-only";
import type { AiProvider } from "@/services/ai/provider";
import type {
  AiBudgetAllocationItem,
  AiPlanInput,
  AiPlanResult,
  AiTimelineItem,
  AiVendorCategory,
} from "@/types/planner";

const CURRENCY = "BDT";

type BudgetTemplate = { category: string; percentage: number }[];

const BUDGET_TEMPLATES: Record<string, BudgetTemplate> = {
  wedding: [
    { category: "Venue", percentage: 30 },
    { category: "Catering", percentage: 25 },
    { category: "Decoration", percentage: 12 },
    { category: "Photography & Videography", percentage: 10 },
    { category: "Attire & Beauty", percentage: 8 },
    { category: "Entertainment (DJ/Music)", percentage: 7 },
    { category: "Invitations & Stationery", percentage: 3 },
    { category: "Contingency", percentage: 5 },
  ],
  birthday: [
    { category: "Venue", percentage: 25 },
    { category: "Catering", percentage: 30 },
    { category: "Decoration", percentage: 18 },
    { category: "Entertainment (DJ/Music)", percentage: 12 },
    { category: "Photography & Videography", percentage: 8 },
    { category: "Invitations & Stationery", percentage: 2 },
    { category: "Contingency", percentage: 5 },
  ],
  corporate: [
    { category: "Venue", percentage: 28 },
    { category: "Catering", percentage: 22 },
    { category: "AV & Production", percentage: 18 },
    { category: "Decoration", percentage: 8 },
    { category: "Photography & Videography", percentage: 8 },
    { category: "Transport & Logistics", percentage: 6 },
    { category: "Invitations & Stationery", percentage: 4 },
    { category: "Contingency", percentage: 6 },
  ],
  default: [
    { category: "Venue", percentage: 28 },
    { category: "Catering", percentage: 25 },
    { category: "Decoration", percentage: 15 },
    { category: "Photography & Videography", percentage: 10 },
    { category: "Entertainment (DJ/Music)", percentage: 10 },
    { category: "Invitations & Stationery", percentage: 4 },
    { category: "Contingency", percentage: 8 },
  ],
};

const VENDOR_CATEGORY_TEMPLATES: Record<string, AiVendorCategory[]> = {
  wedding: [
    { category: "photography", label: "Photography", priority: "essential" },
    { category: "catering", label: "Catering", priority: "essential" },
    { category: "decoration", label: "Decoration", priority: "essential" },
    { category: "makeup", label: "Makeup & Beauty", priority: "essential" },
    { category: "videography", label: "Videography", priority: "recommended" },
    { category: "dj_music", label: "DJ / Music", priority: "recommended" },
    { category: "transport", label: "Transport", priority: "optional" },
    { category: "security", label: "Security", priority: "optional" },
  ],
  birthday: [
    { category: "catering", label: "Catering", priority: "essential" },
    { category: "decoration", label: "Decoration", priority: "essential" },
    { category: "dj_music", label: "DJ / Music", priority: "recommended" },
    { category: "photography", label: "Photography", priority: "recommended" },
    { category: "event_planner", label: "Event Planner", priority: "optional" },
  ],
  corporate: [
    { category: "catering", label: "Catering", priority: "essential" },
    { category: "photography", label: "Photography", priority: "recommended" },
    { category: "videography", label: "Videography", priority: "recommended" },
    { category: "security", label: "Security", priority: "recommended" },
    { category: "transport", label: "Transport", priority: "optional" },
    { category: "event_planner", label: "Event Planner", priority: "optional" },
  ],
  default: [
    { category: "photography", label: "Photography", priority: "recommended" },
    { category: "catering", label: "Catering", priority: "essential" },
    { category: "decoration", label: "Decoration", priority: "recommended" },
    { category: "dj_music", label: "DJ / Music", priority: "optional" },
  ],
};

const TIMELINE_TEMPLATE: { weeksBefore: number; title: string; description?: string }[] = [
  {
    weeksBefore: 12,
    title: "Lock the guest count, budget and venue shortlist",
    description: "Confirm the headline numbers everything else depends on.",
  },
  {
    weeksBefore: 10,
    title: "Book the venue",
    description: "Sign the venue booking so vendor availability can be confirmed against the date.",
  },
  {
    weeksBefore: 8,
    title: "Book key vendors",
    description: "Send quote requests to photography, catering and decoration vendors.",
  },
  {
    weeksBefore: 6,
    title: "Send invitations",
    description: "Share invites and open RSVP tracking.",
  },
  {
    weeksBefore: 4,
    title: "Confirm menu, decor and run-of-show",
    description: "Finalize details with each booked vendor.",
  },
  {
    weeksBefore: 2,
    title: "Confirm final guest count and seating",
    description: "Lock numbers vendors need (catering headcount, seating chart).",
  },
  {
    weeksBefore: 1,
    title: "Final walkthrough and payments",
    description: "Confirm timing with every vendor and settle remaining balances.",
  },
  { weeksBefore: 0, title: "Event day", description: "Enjoy it — the checklist is done." },
];

function titleCase(value: string) {
  return value.replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function buildBudgetAllocation(eventType: string, budget?: number): AiBudgetAllocationItem[] {
  const template = BUDGET_TEMPLATES[eventType] ?? BUDGET_TEMPLATES.default;
  return template.map((row) => ({
    category: row.category,
    percentage: row.percentage,
    amount: budget ? Math.round((budget * row.percentage) / 100) : 0,
  }));
}

function buildTimeline(eventDate?: string): AiTimelineItem[] {
  const parsedDate = eventDate ? new Date(eventDate) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

  return TIMELINE_TEMPLATE.map((step) => {
    let dueDate: string | undefined;
    if (validDate) {
      const d = new Date(validDate);
      d.setDate(d.getDate() - step.weeksBefore * 7);
      dueDate = d.toISOString().slice(0, 10);
    }
    return {
      label: step.weeksBefore === 0 ? "Event day" : `${step.weeksBefore} weeks before`,
      dueDate,
      title: step.title,
      description: step.description,
    };
  });
}

function buildVenueRequirements(input: AiPlanInput) {
  const rows: { label: string; value: string }[] = [];
  if (input.guestCount) {
    rows.push({
      label: "Capacity",
      value: `Seats at least ${input.guestCount} guests comfortably`,
    });
  }
  rows.push({
    label: "Location",
    value: input.location ? `In or near ${input.location}` : "Central, easy for guests to reach",
  });
  if (input.venuePreference) {
    rows.push({ label: "Style", value: input.venuePreference });
  }
  rows.push({
    label: "Budget fit",
    value: input.budget
      ? `Venue cost within ~${Math.round((input.budget * 0.3) / 1000)}k ${CURRENCY} (≈30% of budget)`
      : "Get quotes before allocating a fixed share of the budget",
  });
  rows.push({ label: "Essentials", value: "Parking, power backup, and in-house catering policy confirmed" });
  return rows;
}

export const ruleBasedAiProvider: AiProvider = {
  name: "rule-based",

  async generatePlan(input: AiPlanInput): Promise<AiPlanResult> {
    const eventType = (input.eventType || "other").toLowerCase();
    const label = titleCase(eventType);
    const guestPart = input.guestCount ? `${input.guestCount}-guest ` : "";
    const locationPart = input.location ? ` in ${input.location}` : "";
    const budgetPart = input.budget
      ? ` with a budget of ${input.budget.toLocaleString()} ${CURRENCY}`
      : "";

    const overview =
      `A ${guestPart}${label.toLowerCase()}${locationPart}${budgetPart}. ` +
      `Based on similar events, plan for the venue and catering to take up roughly ` +
      `${eventType === "corporate" ? "50" : eventType === "wedding" ? "55" : "55"}% of the budget, ` +
      `and start locking the venue and key vendors 8–10 weeks out.`;

    const budgetAllocation = buildBudgetAllocation(eventType, input.budget);
    const vendorCategoryTemplate = VENDOR_CATEGORY_TEMPLATES[eventType] ?? VENDOR_CATEGORY_TEMPLATES.default;

    const checklist = [
      { title: "Define the guest list and target headcount" },
      { title: "Set the total budget and category-level caps" },
      { title: "Shortlist and book the venue" },
      { title: "Request quotes from key vendor categories", description: "Photography, catering, decoration." },
      { title: "Send invitations and open RSVP tracking" },
      { title: "Confirm final headcount and seating" },
      { title: "Walk through the run-of-show with every vendor" },
    ];

    const guestChecklist = [
      { title: "Build the guest list with contact details" },
      { title: "Send invitations (digital or print)" },
      { title: "Track RSVPs: pending, confirmed, declined" },
      { title: "Collect meal preferences and plus-ones" },
      { title: "Assign seating/table groups" },
      { title: "Send a reminder as the date approaches" },
    ];

    const importantTasks = [
      { title: "Confirm the venue booking", description: "Do this before booking other vendors." },
      { title: "Set category-level budget caps", description: "Avoid overspending in any one area." },
      {
        title: "Book photography/catering early",
        description: "These categories get booked out first for popular dates.",
      },
    ];

    const vendorRecommendations = vendorCategoryTemplate
      .filter((c) => c.priority === "essential")
      .slice(0, 3)
      .map((c) => ({
        category: c.category,
        title: `Find ${c.label.toLowerCase()} vendors`,
        description: `${c.label} is essential for this event type — start collecting quotes early.`,
        criteria: {
          city: input.location,
          maxPrice: input.budget ? Math.round(input.budget * 0.15) : undefined,
        },
      }));

    const venueRecommendations = [
      {
        title: input.location ? `Venues in ${input.location}` : "Venues matching your guest count",
        description: "Shortlist venues that fit your capacity, budget and style preference.",
        criteria: {
          city: input.location,
          minCapacity: input.guestCount,
          maxPrice: input.budget ? Math.round(input.budget * 0.3) : undefined,
        },
      },
    ];

    return {
      overview,
      budgetAllocation,
      checklist,
      timeline: buildTimeline(input.eventDate),
      venueRequirements: buildVenueRequirements(input),
      vendorCategories: vendorCategoryTemplate,
      vendorRecommendations,
      venueRecommendations,
      guestChecklist,
      importantTasks,
    };
  },
};
