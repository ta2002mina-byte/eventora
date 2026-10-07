import type { Field } from "@/lib/admin/types";

/** Minimal read interface shared by FormData and plain objects (list items). */
export interface Source {
  get(name: string): unknown;
  getAll(name: string): unknown[];
}

export function formSource(fd: FormData): Source {
  return { get: (n) => fd.get(n), getAll: (n) => fd.getAll(n) };
}

function objectSource(obj: Record<string, unknown>): Source {
  return {
    get: (n) => obj[n],
    getAll: (n) => (obj[n] === undefined ? [] : Array.isArray(obj[n]) ? (obj[n] as unknown[]) : [obj[n]]),
  };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/[^\s]+|\/[^\s]*)$/;

export interface CoerceResult {
  payload: Record<string, unknown>;
  errors: Record<string, string>;
  /** `owner` fields still to be resolved from email -> user id. */
  owners: { name: string; column: string; email: string }[];
}

export function coerceFields(fields: Field[], src: Source, mode: "create" | "update"): CoerceResult {
  const payload: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const owners: CoerceResult["owners"] = [];

  for (const f of fields) {
    if (f.type === "heading" || f.type === "readonly") continue;
    if (f.createOnly && mode !== "create") continue;
    const key = f.column ?? f.name;
    const label = f.label;

    if (f.type === "boolean") {
      payload[key] = src.getAll(f.name).some((v) => v === "true" || v === "on" || v === true);
      continue;
    }

    if (f.type === "list") {
      let arr: unknown;
      try {
        arr = JSON.parse(str(src.get(f.name)) || "[]");
      } catch {
        errors[f.name] = `${label}: invalid data`;
        continue;
      }
      if (!Array.isArray(arr)) {
        errors[f.name] = `${label}: invalid data`;
        continue;
      }
      if (arr.length > 50) {
        errors[f.name] = `${label}: too many items (max 50)`;
        continue;
      }
      const items: Record<string, unknown>[] = [];
      for (let i = 0; i < arr.length; i++) {
        const raw = arr[i];
        if (!raw || typeof raw !== "object") continue;
        const r = coerceFields(f.itemFields ?? [], objectSource(raw as Record<string, unknown>), "create");
        const firstErr = Object.values(r.errors)[0];
        if (firstErr) {
          errors[f.name] = `${label} #${i + 1}: ${firstErr}`;
          break;
        }
        items.push(r.payload);
      }
      payload[key] = items;
      continue;
    }

    const raw = str(src.get(f.name));

    if (f.type === "owner") {
      owners.push({ name: f.name, column: key, email: raw.toLowerCase() });
      continue;
    }

    if (f.type === "tags" || f.type === "lines") {
      const parts = (f.type === "tags" ? raw.split(",") : raw.split(/\r?\n/))
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = [...new Set(parts)].slice(0, 100);
      if (f.required && unique.length === 0) errors[f.name] = `${label} is required`;
      payload[key] = unique.map((s) => s.slice(0, 300));
      continue;
    }

    if (raw === "") {
      if (f.required) errors[f.name] = `${label} is required`;
      payload[key] = null;
      continue;
    }

    switch (f.type) {
      case "number": {
        const n = Number(raw);
        if (!Number.isFinite(n)) errors[f.name] = `${label} must be a number`;
        else if (f.min !== undefined && n < f.min) errors[f.name] = `${label} must be at least ${f.min}`;
        else if (f.max !== undefined && n > f.max) errors[f.name] = `${label} must be at most ${f.max}`;
        else if (f.step === 1 && !Number.isInteger(n)) errors[f.name] = `${label} must be a whole number`;
        else payload[key] = n;
        break;
      }
      case "date":
        if (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) errors[f.name] = `${label} must be a valid date`;
        else payload[key] = raw;
        break;
      case "time":
        if (!TIME_RE.test(raw)) errors[f.name] = `${label} must be a valid time`;
        else payload[key] = raw.length === 5 ? `${raw}:00` : raw;
        break;
      case "email":
        if (!EMAIL_RE.test(raw)) errors[f.name] = `${label} must be a valid email`;
        else payload[key] = raw.toLowerCase();
        break;
      case "url":
      case "image":
        if (!URL_RE.test(raw)) errors[f.name] = `${label} must be a valid URL`;
        else payload[key] = raw.slice(0, 1000);
        break;
      case "select": {
        const allowed = f.options?.map((o) => o.value);
        if (allowed && !allowed.includes(raw)) errors[f.name] = `${label}: invalid choice`;
        else payload[key] = raw;
        break;
      }
      case "textarea": {
        const max = f.maxLength ?? 10000;
        if (raw.length > max) errors[f.name] = `${label} is too long (max ${max})`;
        else payload[key] = raw;
        break;
      }
      default: {
        const max = f.maxLength ?? 500;
        if (raw.length > max) errors[f.name] = `${label} is too long (max ${max})`;
        else payload[key] = raw;
      }
    }
  }

  return { payload, errors, owners };
}
