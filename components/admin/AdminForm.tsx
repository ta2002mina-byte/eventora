"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";
import type { Field, FormState } from "@/lib/admin/types";

type Values = Record<string, unknown>;
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function initialValue(f: Field, values: Values): unknown {
  const v = values[f.name];
  return v === undefined || v === null ? f.defaultValue : v;
}

function asText(f: Field, v: unknown): string {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return f.type === "lines" ? v.join("\n") : v.join(", ");
  if (f.type === "time") return String(v).slice(0, 5);
  return String(v);
}

function selectOptions(f: Field) {
  const base = f.options ?? [];
  return f.required ? base : [{ value: "", label: "— None —" }, ...base];
}

const spansFull = (f: Field) =>
  f.full || f.type === "textarea" || f.type === "list" || f.type === "heading" || f.type === "lines" || f.type === "tags";

/* ------------------------------------------------------------------ */
/* Uncontrolled field (top-level)                                      */
/* ------------------------------------------------------------------ */

function FieldInput({ field: f, values, error }: { field: Field; values: Values; error?: string }) {
  const v = initialValue(f, values);

  switch (f.type) {
    case "heading":
      return <h3 className="mt-4 border-b border-border pb-2 font-display text-lg text-charcoal">{f.label}</h3>;

    case "readonly":
      return (
        <div>
          <p className="mb-1.5 text-sm font-medium text-charcoal">{f.label}</p>
          <p className="min-h-[2.75rem] whitespace-pre-wrap rounded-xl border border-border bg-purple-50/40 px-3.5 py-2.5 text-sm text-charcoal-600">
            {asText(f, v) || "—"}
          </p>
        </div>
      );

    case "boolean":
      return (
        <div className="flex flex-col justify-end pb-2">
          <input type="hidden" name={f.name} value="false" />
          <Checkbox name={f.name} value="true" defaultChecked={!!v} label={f.label} error={error} />
          {f.hint && <p className="mt-1.5 text-xs text-charcoal-400">{f.hint}</p>}
        </div>
      );

    case "image":
      return <ImageField field={f} initial={asText(f, v)} error={error} />;

    case "list":
      return (
        <ListEditor
          field={f}
          initial={Array.isArray(v) ? (v as Values[]) : []}
          error={error}
        />
      );

    case "select":
      return (
        <Select
          name={f.name}
          label={f.label + (f.required ? " *" : "")}
          options={selectOptions(f)}
          defaultValue={asText(f, v)}
          placeholder={f.required && !asText(f, v) ? "Select…" : undefined}
          hint={f.hint}
          error={error}
        />
      );

    case "textarea":
    case "lines":
      return (
        <Textarea
          name={f.name}
          label={f.label + (f.required ? " *" : "")}
          defaultValue={asText(f, v)}
          rows={f.type === "lines" ? 5 : 4}
          maxLength={f.maxLength}
          hint={f.hint}
          error={error}
        />
      );

    default: {
      const htmlType =
        f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "email" ? "email" : "text";
      return (
        <Input
          name={f.name}
          type={htmlType}
          label={f.label + (f.required ? " *" : "")}
          defaultValue={asText(f, v)}
          placeholder={f.placeholder}
          min={f.min}
          max={f.max}
          step={f.type === "number" ? f.step ?? "any" : undefined}
          maxLength={f.type === "number" ? undefined : f.maxLength}
          hint={f.hint}
          error={error}
        />
      );
    }
  }
}

function ImageField({ field: f, initial, error }: { field: Field; initial: string; error?: string }) {
  const [url, setUrl] = React.useState(initial);
  return (
    <div>
      <ImageUpload label={f.label + (f.required ? " *" : "")} value={url || undefined} onChange={setUrl} folder={f.folder ?? "admin"} />
      <input type="hidden" name={f.name} value={url} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List editor (array of objects, stored as JSON)                      */
/* ------------------------------------------------------------------ */

function ListEditor({ field: f, initial, error }: { field: Field; initial: Values[]; error?: string }) {
  const itemFields = f.itemFields ?? [];

  const blank = React.useCallback(() => {
    const o: Values = {};
    for (const it of itemFields) o[it.name] = it.type === "boolean" ? false : it.type === "lines" ? [] : it.defaultValue ?? "";
    return o;
  }, [itemFields]);

  const [items, setItems] = React.useState<Values[]>(initial);

  function update(i: number, name: string, value: unknown) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [name]: value } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-charcoal">{f.label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-card border border-border bg-purple-50/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-charcoal-400">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {itemFields.map((it) => (
                <div key={it.name} className={cn(spansFull(it) && "sm:col-span-2")}>
                  <ItemControl field={it} value={item[it.name]} onChange={(v) => update(i, it.name, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-charcoal-400">Nothing here yet.</p>}
        <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setItems((p) => [...p, blank()])}>
          Add item
        </Button>
      </div>
      <input type="hidden" name={f.name} value={JSON.stringify(items)} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ItemControl({ field: f, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const label = f.label + (f.required ? " *" : "");
  if (f.type === "boolean") {
    return <Checkbox label={f.label} checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (f.type === "select") {
    return <Select label={label} options={selectOptions(f)} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
  if (f.type === "lines") {
    const text = Array.isArray(value) ? (value as string[]).join("\n") : String(value ?? "");
    return (
      <Textarea
        label={label}
        rows={4}
        value={text}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    );
  }
  if (f.type === "textarea") {
    return <Textarea label={label} rows={3} value={String(value ?? "")} maxLength={f.maxLength} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <Input
      label={label}
      value={String(value ?? "")}
      placeholder={f.placeholder}
      maxLength={f.maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export interface AdminFormProps {
  fields: Field[];
  values?: Values;
  action: Action;
  submitLabel?: string;
  cancelHref?: string;
  /** Clear the form after a successful save (used by "Add …" forms). */
  resetOnSuccess?: boolean;
  /** Extra buttons rendered next to Save (server-rendered nodes). */
  extra?: React.ReactNode;
}

export function AdminForm({
  fields,
  values = {},
  action,
  submitLabel = "Save changes",
  cancelHref,
  resetOnSuccess = false,
  extra,
}: AdminFormProps) {
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<FormState>({});
  const [formKey, setFormKey] = React.useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await action({}, fd);
        setState(result ?? {});
        if (result?.ok && resetOnSuccess) setFormKey((k) => k + 1);
      } catch (err) {
        // redirect() from the action surfaces as a navigation, not an error.
        if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setState({ error: "Something went wrong. Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div key={formKey} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={cn(spansFull(f) && "sm:col-span-2")}>
            <FieldInput field={f} values={values} error={state.fieldErrors?.[f.name]} />
          </div>
        ))}
      </div>

      {state.error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={pending}>
          {submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref}>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        )}
        {extra}
      </div>
    </form>
  );
}
