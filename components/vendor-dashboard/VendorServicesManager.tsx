"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ServiceFormModal } from "@/components/vendor-dashboard/ServiceFormModal";
import { deleteVendorService, toggleVendorServiceActive } from "@/app/vendor/dashboard/actions";
import type { VendorService } from "@/types/vendor";

export function VendorServicesManager({
  services,
  currency,
}: {
  services: VendorService[];
  currency: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VendorService | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(service: VendorService) {
    setEditing(service);
    setModalOpen(true);
  }

  async function handleDelete(service: VendorService) {
    setPendingId(service.id);
    const result = await deleteVendorService(service.id);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove service", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Service removed" });
    router.refresh();
  }

  async function handleToggle(service: VendorService) {
    setPendingId(service.id);
    const result = await toggleVendorServiceActive(service.id, !service.is_active);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update service", description: result.error });
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-400">
          {services.length} service{services.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<Wrench className="h-6 w-6" />}
          title="No services yet"
          description="Add à la carte services customers can request individually."
        />
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-card border border-border bg-white">
          {services.map((service) => (
            <li key={service.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-charcoal">{service.name}</p>
                  <Badge variant={service.is_active ? "success" : "gray"}>
                    {service.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>
                {service.description && (
                  <p className="mt-0.5 text-sm text-charcoal-400">{service.description}</p>
                )}
                <p className="mt-1 text-sm font-medium text-purple-700">
                  {currency} {service.price.toLocaleString()}
                  {service.unit && <span className="text-charcoal-400"> · {service.unit}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggle(service)}
                  disabled={pendingId === service.id}
                  className="rounded-full px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-60"
                >
                  {service.is_active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${service.name}`}
                  onClick={() => openEdit(service)}
                  className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50 hover:text-purple-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${service.name}`}
                  onClick={() => handleDelete(service)}
                  disabled={pendingId === service.id}
                  className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ServiceFormModal open={modalOpen} onClose={() => setModalOpen(false)} service={editing} />
    </div>
  );
}
