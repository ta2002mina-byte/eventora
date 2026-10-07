import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { SETTINGS_FIELDS, SETTINGS_TABS } from "@/lib/admin/settings-config";
import { SETTINGS_GROUPS, mergeGroup, type SettingsGroup } from "@/lib/site-settings-defaults";
import { first } from "@/lib/admin/format";
import { PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm } from "@/components/admin/AdminForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { cn } from "@/lib/utils";
import { resetSettings, saveSettings } from "../actions";

export const metadata = { title: "Site settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { admin } = await requireAdmin();
  const requested = first(searchParams.tab);
  const group = ((SETTINGS_GROUPS as string[]).includes(requested) ? requested : "general") as SettingsGroup;
  const tab = SETTINGS_TABS.find((t) => t.group === group)!;

  const { data: row } = await admin.from("site_settings").select("value").eq("key", group).maybeSingle();
  const values = mergeGroup(group, row?.value) as unknown as Record<string, unknown>;

  return (
    <div>
      <PageHeader title="Site settings" description="Edit the website's text, contact details, pricing and platform switches. Changes go live immediately." />
      <div className="mb-5 flex flex-wrap gap-2">
        {SETTINGS_TABS.map((t) => (
          <Link key={t.group} href={`/admin/settings?tab=${t.group}`}
            className={cn("rounded-pill border px-4 py-1.5 text-sm", t.group === group ? "border-purple-700 bg-purple-700 text-warmwhite" : "border-border bg-white text-charcoal-600 hover:bg-purple-50")}>
            {t.label}
          </Link>
        ))}
      </div>
      {first(searchParams.reset) && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Reset to defaults.</p>}
      <Panel title={tab.label} description={tab.description}>
        <AdminForm
          key={group}
          fields={SETTINGS_FIELDS[group]}
          values={values}
          action={saveSettings.bind(null, group)}
          submitLabel="Save settings"
          extra={<ConfirmButton action={resetSettings.bind(null, group)} message="Reset this tab to the built-in defaults?" variant="ghost">Reset to defaults</ConfirmButton>}
        />
      </Panel>
    </div>
  );
}
