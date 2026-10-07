/** Pure-data admin config types (safe to serialize to Client Components). */

export type FieldType =
  | "text"
  | "email"
  | "url"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "boolean"
  | "image"
  | "tags" // comma separated -> text[]
  | "lines" // one per line -> text[]
  | "owner" // account email -> user id (column)
  | "list" // array of objects (settings only)
  | "readonly"
  | "heading";

export interface Option {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: Option[];
  /** Load select options from a table at render time. */
  optionsFrom?: { table: string; label: string; value?: string };
  full?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  /** DB column when it differs from `name` (used by `owner`). */
  column?: string;
  /** Storage folder for `image` fields. */
  folder?: string;
  /** Item schema for `list` fields. */
  itemFields?: Field[];
  /** Only shown/saved when creating. */
  createOnly?: boolean;
  /** Value shown when creating a new record. */
  defaultValue?: string | number | boolean;
}

export type ColumnKind = "text" | "badge" | "money" | "date" | "datetime" | "bool" | "mono" | "stars";

export interface ListColumn {
  /** Column name, or `relation.column` for an embedded relation. */
  name: string;
  label: string;
  kind?: ColumnKind;
  /** Render a boolean as an inline on/off switch. */
  toggle?: boolean;
}

export interface ChildResource {
  key: string;
  table: string;
  label: string;
  singular: string;
  /** FK column pointing at the parent row. */
  fk: string;
  titleField: string;
  fields: Field[];
  order: { column: string; ascending: boolean };
  /** Columns summarised on the collapsed row. */
  summary: string[];
}

export interface Resource {
  key: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  titleField: string;
  select?: string;
  list: ListColumn[];
  fields: Field[];
  searchFields: string[];
  filters?: { name: string; label: string; options: Option[] }[];
  order: { column: string; ascending: boolean };
  canCreate: boolean;
  canDelete: boolean;
  /** Auto-generate a slug from this field when the slug is blank. */
  slugFrom?: string;
  slugRandomSuffix?: boolean;
  /** Public page for "View on site", e.g. `/events/{slug}`. */
  publicHref?: string;
  /** Row click target override, e.g. `/admin/bookings/{id}`. */
  detailHref?: string;
  children?: ChildResource[];
  icon: string;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};
