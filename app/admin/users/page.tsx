import { requireAdmin } from "@/lib/admin/auth";
import { PAGE_SIZE, first, formatDateTime, pageParam, safeSearch } from "@/lib/admin/format";
import { deleteUser, setUserRole, setUserSuspended } from "@/app/admin/users/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FilterBar, PageHeader, Pager, StatusBadge } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const metadata = { title: "Users" };

const MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  role: { tone: "ok", text: "Role updated." },
  suspended: { tone: "ok", text: "User suspended — they can no longer sign in." },
  unsuspended: { tone: "ok", text: "User reinstated." },
  deleted: { tone: "ok", text: "User deleted." },
  self: { tone: "err", text: "You can't do that to your own account." },
  "has-orders": { tone: "err", text: "This user has ticket orders, so deleting them would erase financial history. Suspend them instead." },
  invalid: { tone: "err", text: "Invalid request." },
  failed: { tone: "err", text: "The change couldn't be applied. Please try again." },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { admin, user: me } = await requireAdmin();
  const q = safeSearch(first(searchParams.q));
  const page = pageParam(searchParams.page);
  const role = first(searchParams.role);
  const status = first(searchParams.status);

  let query = admin
    .from("profiles")
    .select("id, full_name, email, role, is_suspended, created_at", { count: "exact" });
  const current: Record<string, string> = {};
  if (["customer", "vendor", "admin"].includes(role)) {
    query = query.eq("role", role);
    current.role = role;
  }
  if (status === "suspended") {
    query = query.eq("is_suspended", true);
    current.status = status;
  }
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  const rows = (data ?? []) as any[];
  const flash = MESSAGES[first(searchParams.done)] ?? MESSAGES[first(searchParams.error)];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every account on the platform. Change roles, suspend or remove users."
      />

      {flash && (
        <p
          role={flash.tone === "err" ? "alert" : "status"}
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${flash.tone === "err" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
        >
          {flash.text}
        </p>
      )}

      <FilterBar
        q={q}
        placeholder="Search by name or email…"
        current={current}
        filters={[
          { name: "role", label: "Roles", options: ["customer", "vendor", "admin"].map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) })) },
          { name: "status", label: "Status", options: [{ value: "suspended", label: "Suspended" }] },
        ]}
      />

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

      {rows.length === 0 ? (
        <EmptyState title="No users found" description="Try clearing the search or filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">
                        {u.full_name || "—"} {isMe && <Badge variant="gold" className="ml-1">You</Badge>}
                      </p>
                      <p className="text-xs text-charcoal-400">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      {isMe ? (
                        <StatusBadge value={u.role ?? "customer"} />
                      ) : (
                        <form action={setUserRole.bind(null, u.id)} className="flex items-center gap-1.5">
                          <select
                            name="role"
                            defaultValue={u.role ?? "customer"}
                            aria-label={`Role for ${u.email}`}
                            className="h-9 rounded-xl border border-border bg-white px-2 text-sm focus:border-purple-500 focus:outline-none"
                          >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.is_suspended ? <Badge variant="danger">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-charcoal-600">{formatDateTime(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {isMe ? (
                        <span className="text-xs text-charcoal-400">—</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <ConfirmButton
                            variant="outline"
                            action={setUserSuspended.bind(null, u.id, !u.is_suspended)}
                            message={u.is_suspended ? `Reinstate ${u.email}?` : `Suspend ${u.email}? They won't be able to sign in.`}
                          >
                            {u.is_suspended ? "Reinstate" : "Suspend"}
                          </ConfirmButton>
                          <ConfirmButton
                            action={deleteUser.bind(null, u.id)}
                            message={`Permanently delete ${u.email}? Their events, reviews, messages and saved items are removed too. This can't be undone.`}
                          >
                            Delete
                          </ConfirmButton>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pager page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/admin/users" params={{ q, ...current }} />
        </>
      )}

      <p className="mt-6 text-xs text-charcoal-400">
        Vendor and venue dashboards are unlocked by owning a vendor/venue record (assign one under Vendors / Venues →
        “Owner account”). The role here controls admin access and labels the account.
      </p>
    </div>
  );
}
