"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UserRound, Armchair } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { deleteGuest, updateGuestRsvp } from "@/app/dashboard/events/[id]/guests/actions";
import { RSVP_STATUS_OPTIONS } from "@/types/guest";
import type { GuestRecord, GuestTableRecord, RsvpStatus } from "@/types/guest";
import { GuestFormModal } from "@/components/guests/GuestFormModal";
import { GuestTableManager } from "@/components/guests/GuestTableManager";

const rsvpVariant: Record<RsvpStatus, "gray" | "gold" | "success" | "danger"> = {
  pending: "gray",
  invited: "gold",
  confirmed: "success",
  declined: "danger",
};

export function GuestList({
  eventId,
  initialGuests,
  initialTables,
}: {
  eventId: string;
  initialGuests: GuestRecord[];
  initialTables: GuestTableRecord[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [guests, setGuests] = React.useState(initialGuests);
  const [tables, setTables] = React.useState(initialTables);
  const [query, setQuery] = React.useState("");
  const [rsvpFilter, setRsvpFilter] = React.useState<string>("");
  const [groupFilter, setGroupFilter] = React.useState<string>("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [tablesOpen, setTablesOpen] = React.useState(false);
  const [editingGuest, setEditingGuest] = React.useState<GuestRecord | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => setGuests(initialGuests), [initialGuests]);
  React.useEffect(() => setTables(initialTables), [initialTables]);

  const groups = React.useMemo(
    () => Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean))) as string[],
    [guests]
  );

  const filtered = guests.filter((g) => {
    if (rsvpFilter && g.rsvp_status !== rsvpFilter) return false;
    if (groupFilter && g.group_name !== groupFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${g.name} ${g.email ?? ""} ${g.phone ?? ""} ${g.group_name ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  function tableName(tableId: string | null) {
    if (!tableId) return null;
    return tables.find((t) => t.id === tableId)?.name ?? null;
  }

  function openAdd() {
    setEditingGuest(null);
    setFormOpen(true);
  }

  function openEdit(guest: GuestRecord) {
    setEditingGuest(guest);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditingGuest(null);
    router.refresh();
  }

  async function handleRsvpChange(guest: GuestRecord, status: RsvpStatus) {
    setPendingId(guest.id);
    setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, rsvp_status: status } : g)));
    const result = await updateGuestRsvp(eventId, guest.id, status);
    setPendingId(null);
    if (!result.ok) {
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, rsvp_status: guest.rsvp_status } : g)));
      toast({ variant: "error", title: "Couldn't update RSVP", description: result.error });
    }
  }

  async function handleDelete(guest: GuestRecord) {
    setPendingId(guest.id);
    const result = await deleteGuest(eventId, guest.id);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove guest", description: result.error });
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== guest.id));
    toast({ variant: "success", title: "Guest removed" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search guests…"
          className="max-w-xs"
        />
        <Select
          className="w-40"
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          options={[{ value: "", label: "All RSVPs" }, ...RSVP_STATUS_OPTIONS]}
        />
        {groups.length > 0 && (
          <Select
            className="w-44"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            options={[{ value: "", label: "All groups" }, ...groups.map((g) => ({ value: g, label: g }))]}
          />
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Armchair className="h-4 w-4" />} onClick={() => setTablesOpen(true)}>
            Tables
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add Guest
          </Button>
        </div>
      </div>

      {guests.length === 0 ? (
        <EmptyState
          icon={<UserRound className="h-6 w-6" />}
          title="No guests yet"
          description="Add guests one by one, or generate a guest checklist from the AI Planner."
          actionLabel="Add Guest"
          onAction={openAdd}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No guests match your filters" description="Try clearing the search or filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>RSVP</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Table</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <p className="font-medium text-charcoal">{guest.name}</p>
                  <p className="text-xs text-charcoal-400">
                    {guest.email || guest.phone || "No contact info"}
                    {guest.plus_one && " · +1"}
                  </p>
                </TableCell>
                <TableCell>{guest.group_name || "—"}</TableCell>
                <TableCell>
                  <select
                    aria-label={`RSVP status for ${guest.name}`}
                    className="rounded-pill border border-border bg-white px-2.5 py-1 text-xs font-medium text-charcoal focus:border-purple-500 focus:outline-none"
                    value={guest.rsvp_status}
                    disabled={pendingId === guest.id}
                    onChange={(e) => handleRsvpChange(guest, e.target.value as RsvpStatus)}
                  >
                    {RSVP_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Badge variant={rsvpVariant[guest.rsvp_status]} className="ml-2 hidden sm:inline-flex">
                    {guest.rsvp_status}
                  </Badge>
                </TableCell>
                <TableCell>{guest.meal_preference || "—"}</TableCell>
                <TableCell>{tableName(guest.table_id) || "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label={`Edit ${guest.name}`}
                      onClick={() => openEdit(guest)}
                      className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Remove ${guest.name}`}
                      onClick={() => handleDelete(guest)}
                      disabled={pendingId === guest.id}
                      className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <GuestFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eventId={eventId}
        guest={editingGuest}
        tables={tables}
        onSaved={handleSaved}
      />
      <GuestTableManager open={tablesOpen} onClose={() => setTablesOpen(false)} eventId={eventId} tables={tables} guests={guests} />
    </div>
  );
}
