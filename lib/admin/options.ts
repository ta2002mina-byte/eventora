import "server-only";
import type { Field } from "@/lib/admin/types";

/** Fill in `optionsFrom` selects (e.g. event category) from the database. */
export async function resolveOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  fields: Field[]
): Promise<Field[]> {
  return Promise.all(
    fields.map(async (f) => {
      if (!f.optionsFrom) return f;
      const { table, label, value = "id" } = f.optionsFrom;
      const { data } = await admin.from(table).select(`${value}, ${label}`).order(label, { ascending: true }).limit(500);
      const options = ((data ?? []) as Record<string, string>[]).map((r) => ({
        value: String(r[value]),
        label: String(r[label]),
      }));
      return { ...f, options };
    })
  );
}
