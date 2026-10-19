"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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

type Admin = {
  name: string;
  email: string;
  role: string;
  advisor: "Yes" | "No";
  programs: string;
  lastLogin: string;
};

const initialPending = [
  { name: "John Smith", email: "john.smith@angt.hub", role: "Communities Moderator", status: "Pending", expires: "18 hours" },
  { name: "Sarah Johnson", email: "sarah.j@angt.hub", role: "Financial Officer", status: "Pending", expires: "18 hours" },
  { name: "Mike Chen", email: "mike.chen@angt.hub", role: "Support Agent", status: "Expired", expires: "Expired" },
];

const initialActiveAdmins: Admin[] = [
  { name: "John Smith", email: "john.smith@angt.hub", role: "Communities Moderator", advisor: "Yes", programs: "Frontend Dev & Backend Dev", lastLogin: "2024-02-16 08:30" },
  { name: "Sarah Johnson", email: "sarah.j@angt.hub", role: "Financial Officer", advisor: "Yes", programs: "Backend Dev", lastLogin: "2024-02-16 08:30" },
  { name: "Mike Chen", email: "mike.chen@angt.hub", role: "Support Agent", advisor: "No", programs: "-", lastLogin: "2024-02-16 08:30" },
];

const programOptions = [
  { name: "Frontend Engineering", category: "Web Development" },
  { name: "Backend Development", category: "Web Development" },
  { name: "Data Science", category: "Data & AI" },
  { name: "UX/UI Design", category: "Design" },
  { name: "Mobile Development", category: "Mobile" },
  { name: "DevOps Engineering", category: "Infrastructure" },
];

const roles = ["Communities Moderator", "Financial Officer", "Support Agent", "Program Manager"];

export default function AdminManagementContent() {
  const [tab, setTab] = useState<"pending" | "active">("pending");
  const [pendingAdmins, setPendingAdmins] = useState(initialPending);
  const [activeAdmins, setActiveAdmins] = useState(initialActiveAdmins);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const notify = (message: string) => toast.success(message);

  function openEdit(admin: Admin) {
    setSelectedAdmin(admin);
    setDialogMode("edit");
  }

  function handleAdminSave(admin: Omit<Admin, "lastLogin">) {
    if (dialogMode === "edit" && selectedAdmin) {
      setActiveAdmins((current) => current.map((item) => item.email === selectedAdmin.email ? { ...item, ...admin } : item));
      notify(`${admin.name} was updated successfully`);
    } else {
      setPendingAdmins((current) => [...current, { name: admin.name, email: admin.email, role: admin.role, status: "Pending", expires: "24 hours" }]);
      notify(`Invitation sent to ${admin.name}`);
    }
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
                Pending Invitations <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{pendingAdmins.length}</span>
              </button>
              <button role="tab" aria-selected={tab === "active"} onClick={() => setTab("active")} className={`relative flex h-full items-center gap-2 px-2 text-base ${tab === "active" ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"}`}>
                Active Admins <span className="grid min-w-5 place-items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{activeAdmins.length}</span>
              </button>
            </div>

            <div className="flex flex-col items-stretch justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-600">Manage invitation links and track acceptance status</p>
              <Button className="h-9 shrink-0 px-4 text-sm font-normal shadow-none" onClick={() => { setSelectedAdmin(null); setDialogMode("create"); }}><Plus /> Create New Admin</Button>
            </div>

            <div className="overflow-x-auto" role="tabpanel">
              {tab === "pending" ? <PendingTable admins={pendingAdmins} onAction={notify} /> : <ActiveTable admins={activeAdmins} onAction={notify} onEdit={openEdit} />}
            </div>
          </section>
        </div>

      <AdminDialog
        key={`${dialogMode}-${selectedAdmin?.email ?? "new"}`}
        mode={dialogMode}
        admin={selectedAdmin}
        onOpenChange={(open) => { if (!open) { setDialogMode(null); setSelectedAdmin(null); } }}
        onSave={handleAdminSave}
      />
      <Toaster />
    </div>
  );
}

function AdminDialog({ mode, admin, onOpenChange, onSave }: { mode: "create" | "edit" | null; admin: Admin | null; onOpenChange: (open: boolean) => void; onSave: (admin: Omit<Admin, "lastLogin">) => void }) {
  const initialPrograms = admin?.programs && admin.programs !== "-"
    ? programOptions.filter((program) => admin.programs.includes(program.name.split(" ")[0] ?? program.name)).map((program) => program.name)
    : [];
  const [role, setRole] = useState(admin?.role ?? "");
  const [advisor, setAdvisor] = useState<"Yes" | "No" | "">(admin?.advisor ?? "");
  const [programs, setPrograms] = useState<string[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredPrograms = programOptions.filter((program) => `${program.name} ${program.category}`.toLowerCase().includes(search.toLowerCase()));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    if (!name || !email.includes("@") || !role || !advisor) {
      toast.error("Complete all required admin details.");
      return;
    }
    if (advisor === "Yes" && programs.length === 0) {
      toast.error("Select at least one program for this advisor.");
      return;
    }
    onSave({ name, email, role, advisor, programs: advisor === "Yes" ? programs.join(", ") : "-" });
  }

  function toggleProgram(name: string) {
    setPrograms((current) => current.includes(name) ? current.filter((program) => program !== name) : [...current, name]);
  }

  // The picker opens inside the dialog's scroll area: bring all of it into view,
  // then focus the search without letting the focus scroll undo that.
  useEffect(() => {
    if (!pickerOpen) return;
    pickerRef.current?.scrollIntoView({ block: "nearest" });
    searchRef.current?.focus({ preventScroll: true });
  }, [pickerOpen]);

  return (
    <Dialog open={mode !== null} onOpenChange={onOpenChange}>
      <DialogContent onEscapeKeyDown={(event) => { if (pickerOpen) { event.preventDefault(); setPickerOpen(false); } }} className="flex max-h-[94vh] max-w-[672px] flex-col gap-0 overflow-hidden p-0 [&>button]:right-6 [&>button]:top-[18px] [&>button]:grid [&>button]:size-6 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-muted-foreground [&>button]:text-muted-foreground">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-xl font-semibold leading-7 text-heading">{mode === "edit" ? "Edit Admin" : "Create New Admin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid gap-2"><Label htmlFor="admin-name" className="text-sm font-normal text-ink">Name</Label><Input id="admin-name" name="name" className="h-[42px] px-3 md:text-sm" defaultValue={admin?.name ?? ""} placeholder="John Smith" required /></div>
            <div className="grid gap-2"><Label htmlFor="admin-email" className="text-sm font-normal text-ink">Work Email</Label><Input id="admin-email" name="email" type="email" className="h-[42px] px-3 md:text-sm" defaultValue={admin?.email ?? ""} placeholder="john.smith@angt.hub" required /></div>
            <div className="grid gap-2"><Label className="text-sm font-normal text-ink">Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger className="h-[42px] px-3 md:text-sm [&>svg]:size-5 [&>svg]:text-heading [&>svg]:opacity-100"><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label className="text-sm font-normal text-ink">Admin would be a program advisor?</Label><Select value={advisor} onValueChange={(value) => setAdvisor(value as "Yes" | "No")}><SelectTrigger className="h-[42px] px-3 md:text-sm [&>svg]:size-5 [&>svg]:text-heading [&>svg]:opacity-100"><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2">
              <Label id="programs-label" className="text-sm font-normal text-ink">Select Program(s)</Label>
              <Button type="button" variant="outline" aria-labelledby="programs-label" aria-expanded={pickerOpen} aria-controls="program-picker" onClick={() => setPickerOpen((open) => !open)} className="h-[42px] w-full justify-between overflow-hidden px-3 text-sm font-normal shadow-sm">
                <span className={programs.length ? "truncate text-foreground" : "text-muted-foreground"}>{programs.length ? programs.join(", ") : "Select programs"}</span><ChevronDown className={`size-5 shrink-0 text-heading transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
              </Button>
              {pickerOpen && (
                <div ref={pickerRef} id="program-picker" role="group" aria-labelledby="programs-label" className="space-y-3 rounded-lg border border-border bg-background p-2.5 shadow-sm">
                  <div className="relative"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input ref={searchRef} aria-label="Search programs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Programs..." className="h-[42px] pl-10 md:text-sm" /></div>
                  <div className="grid max-h-[280px] gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
                    {filteredPrograms.map((program) => {
                      const selected = programs.includes(program.name);
                      return (
                        <button type="button" role="checkbox" aria-checked={selected} key={program.name} onClick={() => toggleProgram(program.name)} className={`flex w-full items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${selected ? "border-accent bg-primary-soft/60" : "border-border bg-background hover:bg-slate-50"}`}>
                          <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2 ${selected ? "border-primary text-primary" : "border-heading"}`}>{selected && <Check className="size-3.5" strokeWidth={3} />}</span>
                          <span><span className="block text-base font-semibold text-heading">{program.name}</span><span className="block text-sm text-slate-600">{program.category}</span></span>
                        </button>
                      );
                    })}
                    {filteredPrograms.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground sm:col-span-2">No programs found</p>}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-muted-foreground">{programs.length} selected</p>
                    <Button type="button" size="sm" className="font-normal" onClick={() => setPickerOpen(false)}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><Button type="button" variant="outline" className="h-[38px] px-4 font-normal" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="h-[38px] px-3 font-normal">Save</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingTable({ admins, onAction }: { admins: typeof initialPending; onAction: (message: string) => void }) {
  return (
    <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
      <thead className="bg-table-head text-xs uppercase tracking-wide text-table-label"><tr><th className="w-[16%] px-6 py-3 font-normal">NAME</th><th className="w-[18%] px-6 py-3 font-normal">EMAIL</th><th className="w-[18%] px-6 py-3 font-normal">ROLE</th><th className="w-[15%] px-6 py-3 font-normal">STATUS</th><th className="w-[13%] px-6 py-3 font-normal">EXPIRES</th><th className="w-[20%] px-6 py-3 font-normal">ACTIONS</th></tr></thead>
      <tbody>{admins.map((person) => <tr key={person.email} className="border-t border-border text-sm text-heading"><td className="px-6 py-6 text-base">{person.name}</td><td className="px-6 py-6">{person.email}</td><td className="px-6 py-6"><RolePill>{person.role}</RolePill></td><td className="px-6 py-6"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${person.status === "Expired" ? "bg-expired text-expired-foreground" : "bg-pending/20 text-pending-foreground"}`}>{person.status === "Expired" ? <CircleX className="size-3" /> : <Clock3 className="size-3" />}{person.status}</span></td><td className={`px-3 py-5 ${person.expires === "Expired" ? "text-destructive" : ""}`}>{person.expires}</td><td className="px-6 py-6"><div className="flex items-center gap-2"><button onClick={() => onAction(`Invitation resent to ${person.name}`)} className="inline-flex items-center gap-1 text-base text-blue-600 hover:underline"><RotateCcw className="size-3.5" /> Resend</button><button onClick={() => onAction(`${person.name}’s invitation was revoked`)} className="inline-flex items-center gap-1 text-base text-red-600 hover:underline"><Ban className="size-3.5" /> Revoke</button></div></td></tr>)}</tbody>
    </table>
  );
}

function ActiveTable({ admins, onAction, onEdit }: { admins: Admin[]; onAction: (message: string) => void; onEdit: (admin: Admin) => void }) {
  return (
    <table className="w-full min-w-[1040px] table-fixed border-collapse text-left">
      {/* Figma column widths: 149 / 149 / 149 / 171 / 149 / 149 / 196 of 1110px, 12px cell padding. */}
      <thead className="bg-table-head text-xs uppercase tracking-wide text-table-label"><tr><th className="w-[13.4%] px-3 py-3 font-normal">NAME</th><th className="w-[13.4%] px-3 py-3 font-normal">EMAIL</th><th className="w-[13.4%] px-3 py-3 font-normal">ROLE</th><th className="w-[15.4%] px-3 py-3 font-normal">IS A PROGRAM ADVISOR</th><th className="w-[13.4%] px-3 py-3 font-normal">PROGRAMS</th><th className="w-[13.4%] px-3 py-3 font-normal">LAST LOGIN</th><th className="w-[17.6%] px-3 py-3 font-normal">ACTIONS</th></tr></thead>
      <tbody>{admins.map((person) => <tr key={person.email} className="border-t border-border text-sm text-heading"><td className="px-3 py-5 text-base">{person.name}</td><td className="truncate px-3 py-5" title={person.email}>{person.email}</td><td className="px-3 py-5"><RolePill>{person.role}</RolePill></td><td className="px-3 py-5 text-center">{person.advisor}</td><td className="px-3 py-5 leading-5">{person.programs}</td><td className="whitespace-nowrap px-3 py-5">{person.lastLogin}</td><td className="px-3 py-5"><div className="flex items-center gap-3 whitespace-nowrap"><button onClick={() => onEdit(person)} className="text-base text-blue-600 hover:underline">Edit Role</button><button onClick={() => onAction(`${person.name} was deactivated`)} className="text-base text-red-600 hover:underline">Deactivate</button></div></td></tr>)}</tbody>
    </table>
  );
}

function RolePill({ children }: { children: string }) {
  return <span className="inline-flex whitespace-nowrap rounded-full bg-role px-2.5 py-1 text-xs text-role-foreground">{children}</span>;
}