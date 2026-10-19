"use client";

import { useId, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { Initial } from "./shared";
import type { Member } from "./data";

/*
 * Same modal anatomy as the other modules (see manage-programs FormFields):
 * shared <Modal>, 14px labels with " *", gray-300 inputs with a primary focus
 * ring, and a Cancel + primary action footer.
 */

const control =
  "w-full rounded-lg border border-gray-300 bg-white px-4 text-base leading-5 text-ink placeholder:text-ink/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-5 text-gray-900">
        {label}
        {required && " *"}
      </label>
      {children(id)}
    </div>
  );
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-10.5", className)} {...props} />;
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={cn(control, "resize-y py-2 leading-6", className)} {...props} />;
}

function ImageDrop({ id, name, onChange }: { id: string; name?: string; onChange: (name?: string) => void }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-10 text-center text-slate-700 focus-within:border-primary hover:bg-gray-50"
    >
      <ImageIcon aria-hidden className="size-10" />
      <span className="text-base leading-6 font-medium">{name ?? "Click to upload cover image"}</span>
      <span className="text-sm leading-5 font-medium">PNG, JPG up to 10MB</span>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0]?.name)}
      />
    </label>
  );
}

function ModalActions({ formId, submitLabel, onCancel }: { formId: string; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="h-11 rounded-lg border border-gray-300 px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        className="h-11 rounded-lg bg-primary px-6 text-sm leading-5 font-semibold text-white hover:bg-primary/90"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export type CommunityDraft = { name: string; description: string; cover?: string };

/** Create / Edit Community (Figma 293:33615, 293:33555). Mount only while open. */
export function CommunityFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: CommunityDraft;
  onClose: () => void;
  onSave: (draft: CommunityDraft) => void;
}) {
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cover, setCover] = useState(initial?.cover);
  const editing = Boolean(initial);

  return (
    <Modal
      open
      size="md"
      title={editing ? "Edit Community" : "Create Community"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions
          formId={formId}
          onCancel={onClose}
          submitLabel={editing ? "Update Community" : "Create Community"}
        />
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: name.trim(), description: description.trim(), cover });
        }}
      >
        <Field label="Community Name" required>
          {(id) => (
            <TextInput
              id={id}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full-Stack Development"
            />
          )}
        </Field>
        <Field label="Description" required>
          {(id) => (
            <TextArea
              id={id}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the community"
            />
          )}
        </Field>
        <Field label="Cover Image" required>
          {(id) => <ImageDrop id={id} name={cover} onChange={setCover} />}
        </Field>
      </form>
    </Modal>
  );
}

export type ChannelDraft = { name: string; description: string };

/** Create / Edit Channel (Figma 293:33652, 293:33591). Mount only while open. */
export function ChannelFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ChannelDraft;
  onClose: () => void;
  onSave: (draft: ChannelDraft) => void;
}) {
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const editing = Boolean(initial);

  return (
    <Modal
      open
      size="md"
      title={editing ? "Edit Channel" : "Create Channel"}
      titleClassName="text-gray-900"
      onClose={onClose}
      footer={
        <ModalActions formId={formId} onCancel={onClose} submitLabel={editing ? "Update Channel" : "Create Channel"} />
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Channel names are slugs: "Help Desk" → "help-desk".
          onSave({ name: name.trim().toLowerCase().replace(/\s+/g, "-"), description: description.trim() });
        }}
      >
        <Field label="Channel Name" required>
          {(id) => (
            <TextInput id={id} required value={name} onChange={(e) => setName(e.target.value)} placeholder="General" />
          )}
        </Field>
        <Field label="Description" required>
          {(id) => (
            <TextArea
              id={id}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the channel"
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}

const memberAction = "h-11 w-full rounded-lg px-6 text-sm leading-5 font-semibold transition-colors";

/** Manage Member (Figma 293:33458). */
export function ManageMemberModal({
  member,
  onClose,
  onToggleMute,
  onToggleSuspend,
  onRemove,
}: {
  member: Member;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleSuspend: () => void;
  onRemove: () => void;
}) {
  const suspended = member.status === "suspended";
  return (
    <Modal open size="sm" title="Manage Member" titleClassName="text-lg leading-7 text-gray-900" onClose={onClose}>
      <div className="flex items-center gap-3">
        <Initial name={member.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base leading-6 font-semibold text-gray-900">{member.name}</p>
          <p className="truncate text-sm leading-5 text-gray-500">{member.email}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className={cn(memberAction, "border border-[#ff8d28] text-[#ff8d28] hover:bg-orange-50")}
        >
          {member.muted ? "Unmute Member" : "Mute Member"}
        </button>
        <button
          type="button"
          onClick={onToggleSuspend}
          className={cn(memberAction, "bg-[#ff8d28] text-white hover:bg-[#ff8d28]/90")}
        >
          {suspended ? "Reinstate Member" : "Suspend Member"}
        </button>
        <button type="button" onClick={onRemove} className={cn(memberAction, "bg-danger text-white hover:bg-danger/90")}>
          Remove from Community
        </button>
      </div>
    </Modal>
  );
}
