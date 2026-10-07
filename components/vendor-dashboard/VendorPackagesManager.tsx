"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package as PackageIcon, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PackageFormModal } from "@/components/vendor-dashboard/PackageFormModal";
import { deleteVendorPackage, toggleVendorPackageActive } from "@/app/vendor/dashboard/actions";
import type { VendorPackage } from "@/types/vendor";

export function VendorPackagesManager({
  packages,
  currency,
}: {
  packages: VendorPackage[];
  currency: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VendorPackage | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(pkg: VendorPackage) {
    setEditing(pkg);
    setModalOpen(true);
  }

  async function handleDelete(pkg: VendorPackage) {
    setPendingId(pkg.id);
    const result = await deleteVendorPackage(pkg.id);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove package", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Package removed" });
    router.refresh();
  }

  async function handleToggle(pkg: VendorPackage) {
    setPendingId(pkg.id);
    const result = await toggleVendorPackageActive(pkg.id, !pkg.is_active);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update package", description: result.error });
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-400">
          {packages.length} package{packages.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add package
        </Button>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<PackageIcon className="h-6 w-6" />}
          title="No packages yet"
          description="Bundle your services into fixed-price packages customers can book directly."
        />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col rounded-card border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-charcoal">{pkg.name}</p>
                  {pkg.is_popular && (
                    <Badge variant="gold">
                      <Sparkles className="h-3 w-3" /> Popular
                    </Badge>
                  )}
                  <Badge variant={pkg.is_active ? "success" : "gray"}>
                    {pkg.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${pkg.name}`}
                    onClick={() => openEdit(pkg)}
                    className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50 hover:text-purple-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${pkg.name}`}
                    onClick={() => handleDelete(pkg)}
                    disabled={pendingId === pkg.id}
                    className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-lg font-medium text-purple-700">
                {currency} {pkg.price.toLocaleString()}
              </p>
              {pkg.duration && <p className="text-xs text-charcoal-400">{pkg.duration}</p>}
              {pkg.description && <p className="mt-2 text-sm text-charcoal-600">{pkg.description}</p>}
              {pkg.included_services.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {pkg.included_services.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-charcoal-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => handleToggle(pkg)}
                disabled={pendingId === pkg.id}
                className="mt-3 self-start rounded-full px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-60"
              >
                {pkg.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      )}

      <PackageFormModal open={modalOpen} onClose={() => setModalOpen(false)} pkg={editing} />
    </div>
  );
}
