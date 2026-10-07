"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Armchair } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { saveGuestTable, deleteGuestTable } from "@/app/dashboard/events/[id]/guests/actions";
import type { GuestRecord, GuestTableRecord } from "@/types/guest";

const schema = z.object({
  name: z.string().trim().min(1, "Give the table a name").max(80),
  capacity: z.coerce.number().int().min(1).max(100),
});
type FormValues = z.infer<typeof schema>;

export function GuestTableManager({
  open,
  onClose,
  eventId,
  tables,
  guests,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  tables: GuestTableRecord[];
  guests: GuestRecord[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", capacity: 8 },
  });

  async function onSubmit(values: FormValues) {
    const result = await saveGuestTable({ eventId, name: values.name, capacity: values.capacity });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't add table", description: result.error });
      return;
    }
    reset({ name: "", capacity: 8 });
    toast({ variant: "success", title: "Table added" });
    router.refresh();
  }

  async function handleDelete(tableId: string) {
    setPendingId(tableId);
    const result = await deleteGuestTable(eventId, tableId);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove table", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Table removed" });
    router.refresh();
  }

  function seatedCount(tableId: string) {
    return guests.filter((g) => g.table_id === tableId).length;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Seating tables"
      description="Create tables, then assign guests from the guest list."
      className="max-w-xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-[1fr_auto_auto] gap-2"
        noValidate
      >
        <Input placeholder="Table name, e.g. Table 1" error={errors.name?.message} {...register("name")} />
        <Input type="number" min={1} className="w-24" {...register("capacity")} />
        <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      </form>

      <div className="mt-4">
        {tables.length === 0 ? (
          <EmptyState
            icon={<Armchair className="h-6 w-6" />}
            title="No tables yet"
            description="Add a table above to start assigning guests to seats."
          />
        ) : (
          <ul className="space-y-2">
            {tables.map((table) => {
              const seated = seatedCount(table.id);
              const isFull = seated >= table.capacity;
              return (
                <li
                  key={table.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">{table.name}</p>
                    <p className="mt-0.5 text-xs text-charcoal-400">
                      {seated}/{table.capacity} seated
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isFull ? "danger" : "gray"}>{isFull ? "Full" : "Open"}</Badge>
                    <button
                      aria-label={`Remove table "${table.name}"`}
                      onClick={() => handleDelete(table.id)}
                      disabled={pendingId === table.id}
                      className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
