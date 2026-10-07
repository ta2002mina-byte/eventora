"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Images } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { addPortfolioItem, deletePortfolioItem } from "@/app/vendor/dashboard/actions";
import type { VendorPortfolioItem } from "@/types/vendor";

const schema = z.object({
  projectName: z.string().trim().min(1, "Give the project a name").max(160),
  caption: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function VendorPortfolioManager({ items }: { items: VendorPortfolioItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectName: "", caption: "", imageUrl: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await addPortfolioItem(values);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't add project", description: result.error });
      return;
    }
    reset({ projectName: "", caption: "", imageUrl: "" });
    toast({ variant: "success", title: "Project added" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    const result = await deletePortfolioItem(id);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove project", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Project removed" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate>
        <Input
          placeholder="Project name"
          error={errors.projectName?.message}
          {...register("projectName")}
        />
        <Input placeholder="Caption (optional)" error={errors.caption?.message} {...register("caption")} />
        <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
        <Input
          className="sm:col-span-3"
          placeholder="Image URL (optional) — Supabase Storage uploads arrive with vendor media management"
          error={errors.imageUrl?.message}
          {...register("imageUrl")}
        />
      </form>

      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyState
            icon={<Images className="h-6 w-6" />}
            title="No portfolio items yet"
            description="Add a past project above so customers can see your work."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-purple-50 to-gold-50 p-3 text-center"
              >
                <span className="font-display text-base italic text-purple-700">
                  {item.project_name ?? "Project"}
                </span>
                {item.caption && (
                  <p className="mt-1 line-clamp-2 text-xs text-charcoal-400">{item.caption}</p>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${item.project_name ?? "project"}`}
                  onClick={() => handleDelete(item.id)}
                  disabled={pendingId === item.id}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 shadow-softer transition-opacity group-hover:opacity-100 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
