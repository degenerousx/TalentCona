"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChevronDown,
  Ban,
  Check,
  CircleX,
  Clock3,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Toaster } from "@/components/shadcn/sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState, QueryState } from "@/components/ui/States";
import { useSession } from "@/lib/session";

import {
  useInviteAdmin,
  usePendingInvitations,
  useProgramOptions,
  useResendInvitation,
  useRevokeInvitation,
  useRoles,
  useSetAdminActive,
  useTeamMembers,
  useUpdateAdmin,
} from "./api";
import type { Admin, AdminForm, Invitation } from "./data";

/** Privilege code → catalog label; falls back to "Manage support" style text until the catalog loads. */
type RoleLabel = (privilege: string) => string;

function fallbackLabel(privilege: string) {
  const text = privilege.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function useRoleLabel(): RoleLabel {
  const { data } = useRoles();
  return useMemo(() => {
    const labels = new Map(data?.map((role) => [role.privilege, role.label]));
    return (privilege) => labels.get(privilege) ?? fallbackLabel(privilege);
  }, [data]);
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

export default function AdminManagementContent() {
  const [tab, setTab] = useState<"pending" | "active">("pending");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const invitations = usePendingInvitations();
  const members = useTeamMembers();
  const roleLabel = useRoleLabel();

  function openEdit(admin: Admin) {
    setSelectedAdmin(admin);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setSelectedAdmin(null);
  }

  return (
    <div className="text-foreground">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6">
            <PageHeader title="Admin Management" description="Invite and manage administrative team members" />
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <div className="flex h-[58px] items-end gap-8 border-b border-border px-6" role="tablist" aria-label="Admin views">
              <button role="tab" aria-selected={tab === "pending"} onClick={() => setTab("pending")} className={`relative flex h-full items-center gap-2 px-2 text-base ${tab === "pending" ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"}`}>
                Pending Invitations <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{invitations.data?.total ?? "–"}</span>
              </button>
              <button role="tab" aria-selected={tab === "active"} onClick={() => setTab("active")} className={`relative flex h-full items-center gap-2 px-2 text-base ${tab === "active" ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"}`}>
                Active Admins <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{members.data?.total ?? "–"}</span>
              </button>
            </div>

            <div className="flex flex-col items-stretch justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-600">Manage invitation links and track acceptance status</p>
              <Button className="h-9 shrink-0 px-4 text-sm font-normal shadow-none" onClick={() => { setSelectedAdmin(null); setDialogMode("create"); }}><Plus /> Create New Admin</Button>
            </div>

            <div className="overflow-x-auto" role="tabpanel">
              {tab === "pending" ? (
                <QueryState
                  query={invitations}
                  isEmpty={(data) => data.items.length === 0}
                  errorTitle="Couldn't load invitations"
                  empty={<EmptyState title="No pending invitations" description="Invite an admin to get started." />}
                >
                  {(data) => <PendingTable invitations={data.items} roleLabel={roleLabel} />}
                </QueryState>
              ) : (
                <QueryState
                  query={members}
                  isEmpty={(data) => data.items.length === 0}
                  errorTitle="Couldn't load admins"
                  empty={<EmptyState title="No admins yet" description="Invite an admin to get started." />}
                >
                  {(data) => <ActiveTable admins={data.items} roleLabel={roleLabel} onEdit={openEdit} />}
                </QueryState>
              )}
            </div>
          </section>
        </div>

      <AdminDialog
        key={`${dialogMode}-${selectedAdmin?.id ?? "new"}`}
        mode={dialogMode}
        admin={selectedAdmin}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        onSaved={(message) => { toast.success(message); if (dialogMode === "create") setTab("pending"); closeDialog(); }}
      />
      <Toaster />
    </div>
  );
}

type PickerOption = { value: string; name: string; category: string };

/** The dialog's searchable checkbox list — used for roles and for programs. */
function CheckboxPicker({ id, labelId, open, onOpenChange, options, selected, onToggle, placeholder, searchLabel, emptyText, status }: {
  id: string;
  labelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: PickerOption[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  emptyText: string;
  /** Shown instead of the options while they load or when they failed. */
  status?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = options.filter((option) => `${option.name} ${option.category}`.toLowerCase().includes(search.toLowerCase()));
  const names = selected.map((value) => options.find((option) => option.value === value)?.name ?? value);

  // The picker opens inside the dialog's scroll area: bring all of it into view,
  // then focus the search without letting the focus scroll undo that.
  useEffect(() => {
    if (!open) return;
    pickerRef.current?.scrollIntoView({ block: "nearest" });
    searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" aria-labelledby={labelId} aria-expanded={open} aria-controls={id} onClick={() => onOpenChange(!open)} className="h-[42px] w-full justify-between overflow-hidden px-3 text-sm font-normal shadow-sm">
        <span className={selected.length ? "truncate text-foreground" : "text-muted-foreground"}>{selected.length ? names.join(", ") : placeholder}</span><ChevronDown className={`size-5 shrink-0 text-heading transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div ref={pickerRef} id={id} role="group" aria-labelledby={labelId} className="space-y-3 rounded-lg border border-border bg-background p-2.5 shadow-sm">
          {status ?? (
            <>
              <div className="relative"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input ref={searchRef} aria-label={searchLabel} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${searchLabel}...`} className="h-[42px] pl-10 md:text-sm" /></div>
              <div className="grid max-h-[280px] gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
                {filtered.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <button type="button" role="checkbox" aria-checked={isSelected} key={option.value} onClick={() => onToggle(option.value)} className={`flex w-full items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${isSelected ? "border-accent bg-primary-soft/60" : "border-border bg-background hover:bg-slate-50"}`}>
                      <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2 ${isSelected ? "border-primary text-primary" : "border-heading"}`}>{isSelected && <Check className="size-3.5" strokeWidth={3} />}</span>
                      <span><span className="block text-base font-semibold text-heading">{option.name}</span><span className="block text-sm text-slate-600">{option.category}</span></span>
                    </button>
                  );
                })}
                {filtered.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground sm:col-span-2">{emptyText}</p>}
              </div>
            </>
          )}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">{selected.length} selected</p>
            <Button type="button" size="sm" className="font-normal" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      )}
    </>
  );
}

function AdminDialog({ mode, admin, onOpenChange, onSaved }: { mode: "create" | "edit" | null; admin: Admin | null; onOpenChange: (open: boolean) => void; onSaved: (message: string) => void }) {
  const [roles, setRoles] = useState<string[]>(admin?.roles ?? []);
  const [advisor, setAdvisor] = useState<"Yes" | "No" | "">(admin?.advisor ?? "");
  const [programIds, setProgramIds] = useState<string[]>(admin?.programIds ?? []);
  const [openPicker, setOpenPicker] = useState<"roles" | "programs" | null>(null);
  const roleOptions = useRoles();
  const programOptions = useProgramOptions(mode !== null && (openPicker === "programs" || programIds.length > 0));
  const invite = useInviteAdmin();
  const update = useUpdateAdmin();
  const saving = invite.isPending || update.isPending;

  // Until programs load, show the names the member record already carries.
  const programPickerOptions = useMemo<PickerOption[]>(() => {
    if (programOptions.data) return programOptions.data.map((program) => ({ value: program.id, name: program.name, category: program.category }));
    const titles = admin && admin.programs !== "-" ? admin.programs.split(", ") : [];
    return admin?.programIds.map((id, index) => ({ value: id, name: titles[index] ?? id, category: "" })) ?? [];
  }, [programOptions.data, admin]);

  function toggle(setter: (update: (current: string[]) => string[]) => void, value: string) {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = admin?.name ?? String(form.get("name") ?? "").trim();
    const email = admin?.email ?? String(form.get("email") ?? "").trim();
    if (!name || !email.includes("@") || roles.length === 0 || !advisor) {
      toast.error("Complete all required admin details.");
      return;
    }
    if (advisor === "Yes" && programIds.length === 0) {
      toast.error("Select at least one program for this advisor.");
      return;
    }
    const values: AdminForm = { name, email, roles, isProgramAdvisor: advisor === "Yes", programIds };
    const onError = (error: unknown) => toast.error(errorMessage(error));
    if (mode === "edit" && admin) {
      update.mutate({ id: admin.id, form: values }, { onSuccess: () => onSaved(`${name} was updated successfully`), onError });
    } else {
      invite.mutate(values, { onSuccess: () => onSaved(`Invitation sent to ${name}`), onError });
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!saving) onOpenChange(open); }}>
      <DialogContent onEscapeKeyDown={(event) => { if (openPicker) { event.preventDefault(); setOpenPicker(null); } }} className="flex max-h-[94vh] max-w-[672px] flex-col gap-0 overflow-hidden p-0 [&>button]:right-6 [&>button]:top-[18px] [&>button]:grid [&>button]:size-6 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-muted-foreground [&>button]:text-muted-foreground">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-xl font-semibold leading-7 text-heading">{mode === "edit" ? "Edit Admin" : "Create New Admin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* The API can't change a member's name or email, so they're read-only when editing. */}
            <div className="grid gap-2"><Label htmlFor="admin-name" className="text-sm font-normal text-ink">Name</Label><Input id="admin-name" name="name" className="h-[42px] px-3 md:text-sm" defaultValue={admin?.name ?? ""} placeholder="John Smith" required disabled={mode === "edit"} /></div>
            <div className="grid gap-2"><Label htmlFor="admin-email" className="text-sm font-normal text-ink">Work Email</Label><Input id="admin-email" name="email" type="email" className="h-[42px] px-3 md:text-sm" defaultValue={admin?.email ?? ""} placeholder="john.smith@angt.hub" required disabled={mode === "edit"} /></div>
            <div className="grid gap-2">
              <Label id="roles-label" className="text-sm font-normal text-ink">Role</Label>
              <CheckboxPicker
                id="role-picker"
                labelId="roles-label"
                open={openPicker === "roles"}
                onOpenChange={(open) => setOpenPicker(open ? "roles" : null)}
                options={roleOptions.data?.map((role) => ({ value: role.privilege, name: role.label, category: role.group })) ?? []}
                selected={roles}
                onToggle={(value) => toggle(setRoles, value)}
                placeholder="Select role"
                searchLabel="Search Roles"
                emptyText="No roles found"
                status={roleOptions.isError ? <ErrorState error={roleOptions.error} title="Couldn't load roles" onRetry={() => void roleOptions.refetch()} retrying={roleOptions.isFetching} /> : roleOptions.data ? undefined : <LoadingState variant="inline" label="Loading roles…" />}
              />
            </div>
            <div className="grid gap-2"><Label className="text-sm font-normal text-ink">Admin would be a program advisor?</Label><Select value={advisor} onValueChange={(value) => setAdvisor(value as "Yes" | "No")}><SelectTrigger className="h-[42px] px-3 md:text-sm [&>svg]:size-5 [&>svg]:text-heading [&>svg]:opacity-100"><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2">
              <Label id="programs-label" className="text-sm font-normal text-ink">Select Program(s)</Label>
              <CheckboxPicker
                id="program-picker"
                labelId="programs-label"
                open={openPicker === "programs"}
                onOpenChange={(open) => setOpenPicker(open ? "programs" : null)}
                options={programPickerOptions}
                selected={programIds}
                onToggle={(value) => toggle(setProgramIds, value)}
                placeholder="Select programs"
                searchLabel="Search Programs"
                emptyText="No programs found"
                status={programOptions.isError ? <ErrorState error={programOptions.error} title="Couldn't load programs" onRetry={() => void programOptions.refetch()} retrying={programOptions.isFetching} /> : programOptions.data ? undefined : <LoadingState variant="inline" label="Loading programs…" />}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><Button type="button" variant="outline" className="h-[38px] px-4 font-normal" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="h-[38px] px-3 font-normal" disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingTable({ invitations, roleLabel }: { invitations: Invitation[]; roleLabel: RoleLabel }) {
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();
  const busy = (id: string) => (resend.isPending && resend.variables === id) || (revoke.isPending && revoke.variables === id);

  function run(mutation: typeof resend, person: Invitation, success: string) {
    mutation.mutate(person.id, { onSuccess: () => toast.success(success), onError: (error) => toast.error(errorMessage(error)) });
  }

  return (
    <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
      <thead className="bg-table-head text-xs uppercase tracking-wide text-table-label"><tr><th className="w-[16%] px-6 py-3 font-normal">NAME</th><th className="w-[18%] px-6 py-3 font-normal">EMAIL</th><th className="w-[18%] px-6 py-3 font-normal">ROLE</th><th className="w-[15%] px-6 py-3 font-normal">STATUS</th><th className="w-[13%] px-6 py-3 font-normal">EXPIRES</th><th className="w-[20%] px-6 py-3 font-normal">ACTIONS</th></tr></thead>
      <tbody>{invitations.map((person) => <tr key={person.id} className="border-t border-border text-sm text-heading"><td className="px-6 py-6 text-base">{person.name}</td><td className="px-6 py-6">{person.email}</td><td className="px-6 py-6"><RolePills roles={person.roles} roleLabel={roleLabel} /></td><td className="px-6 py-6"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${person.status === "Expired" ? "bg-expired text-expired-foreground" : "bg-pending/20 text-pending-foreground"}`}>{person.status === "Expired" ? <CircleX className="size-3" /> : <Clock3 className="size-3" />}{person.status}</span></td><td className={`px-3 py-5 ${person.expires === "Expired" ? "text-destructive" : ""}`}>{person.expires}</td><td className="px-6 py-6"><div className="flex items-center gap-2"><button disabled={busy(person.id)} onClick={() => run(resend, person, `Invitation resent to ${person.name}`)} className="inline-flex items-center gap-1 text-base text-blue-600 hover:underline disabled:opacity-50 disabled:hover:no-underline"><RotateCcw className="size-3.5" /> Resend</button><button disabled={busy(person.id)} onClick={() => run(revoke, person, `${person.name}’s invitation was revoked`)} className="inline-flex items-center gap-1 text-base text-red-600 hover:underline disabled:opacity-50 disabled:hover:no-underline"><Ban className="size-3.5" /> Revoke</button></div></td></tr>)}</tbody>
    </table>
  );
}

function ActiveTable({ admins, roleLabel, onEdit }: { admins: Admin[]; roleLabel: RoleLabel; onEdit: (admin: Admin) => void }) {
  const setActive = useSetAdminActive();
  const myId = useSession()?.claims.sub;

  function toggleActive(person: Admin) {
    const active = person.status !== "Active";
    setActive.mutate(
      { id: person.id, active },
      { onSuccess: () => toast.success(`${person.name} was ${active ? "reactivated" : "deactivated"}`), onError: (error) => toast.error(errorMessage(error)) },
    );
  }

  return (
    <table className="w-full min-w-[1040px] table-fixed border-collapse text-left">
      {/* Figma column widths: 149 / 149 / 149 / 171 / 149 / 149 / 196 of 1110px, 12px cell padding. */}
      <thead className="bg-table-head text-xs uppercase tracking-wide text-table-label"><tr><th className="w-[13.4%] px-3 py-3 font-normal">NAME</th><th className="w-[13.4%] px-3 py-3 font-normal">EMAIL</th><th className="w-[13.4%] px-3 py-3 font-normal">ROLE</th><th className="w-[15.4%] px-3 py-3 font-normal">IS A PROGRAM ADVISOR</th><th className="w-[13.4%] px-3 py-3 font-normal">PROGRAMS</th><th className="w-[13.4%] px-3 py-3 font-normal">LAST LOGIN</th><th className="w-[17.6%] px-3 py-3 font-normal">ACTIONS</th></tr></thead>
      <tbody>{admins.map((person) => {
        const pending = setActive.isPending && setActive.variables?.id === person.id;
        const inactive = person.status !== "Active";
        return <tr key={person.id} className="border-t border-border text-sm text-heading"><td className={`px-3 py-5 text-base ${inactive ? "text-muted-foreground" : ""}`}>{person.name}</td><td className="truncate px-3 py-5" title={person.email}>{person.email}</td><td className="px-3 py-5">{person.isSuperAdmin ? <RolePill>Super Admin</RolePill> : <RolePills roles={person.roles} roleLabel={roleLabel} />}</td><td className="px-3 py-5 text-center">{person.advisor}</td><td className="px-3 py-5 leading-5">{person.programs}</td><td className="whitespace-nowrap px-3 py-5">{person.lastLogin}</td><td className="px-3 py-5"><div className="flex items-center gap-3 whitespace-nowrap"><button onClick={() => onEdit(person)} className="text-base text-blue-600 hover:underline">Edit Role</button>{person.id !== myId && <button disabled={pending} onClick={() => toggleActive(person)} className={`text-base hover:underline disabled:opacity-50 disabled:hover:no-underline ${inactive ? "text-blue-600" : "text-red-600"}`}>{inactive ? "Reactivate" : "Deactivate"}</button>}</div></td></tr>;
      })}</tbody>
    </table>
  );
}

function RolePills({ roles, roleLabel }: { roles: string[]; roleLabel: RoleLabel }) {
  if (roles.length === 0) return <span className="text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-1">{roles.map((role) => <RolePill key={role}>{roleLabel(role)}</RolePill>)}</div>;
}

function RolePill({ children }: { children: string }) {
  return <span title={children} className="inline-block max-w-full truncate whitespace-nowrap rounded-full bg-role px-2.5 py-1 text-xs text-role-foreground">{children}</span>;
}
