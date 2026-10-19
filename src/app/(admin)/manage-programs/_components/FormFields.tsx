"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, CloudUpload, ImageIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Input, textarea and select share the Figma "input" frame: gray-300 border, 8px radius. */
const control =
  "w-full rounded-lg border border-gray-300 bg-white px-4 text-base leading-5 text-ink placeholder:text-ink/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  /** Receives the generated id so the control can be linked to its label. */
  children: (id: string) => React.ReactNode;
};

export function Field({ label, required, hint, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm leading-5 text-gray-900">
        {label}
        {required && " *"}
      </label>
      {children(id)}
      {hint && <p className="text-xs leading-4 text-gray-500">{hint}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: InputProps) {
  return <input className={cn(control, "h-[42px]", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={cn(control, "resize-y py-2 leading-6", className)} {...props} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: string[];
  placeholder?: string;
};

export function Select({ options, placeholder = "Select…", className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(control, "h-[41px] appearance-none pr-10", className)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-900"
      />
    </div>
  );
}

/** Dashed "Choose a file or drag & drop it here" box from the lesson and resource modals. */
export function FileDrop({
  id,
  accept,
  hint,
  onFile,
}: {
  id: string;
  accept?: string;
  hint: string;
  onFile?: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const take = (file?: File) => {
    if (!file) return;
    setName(file.name);
    onFile?.(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        take(e.dataTransfer.files[0]);
      }}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-[26px] border-4 border-dashed px-4 py-6 text-center",
        dragging ? "border-primary bg-primary-soft" : "border-[#cbd0dc] bg-white",
      )}
    >
      <CloudUpload aria-hidden className="size-10 text-[#292d32]" />
      <p className="text-xl leading-6 text-[#292d32]">Choose a file or drag &amp; drop it here</p>
      <p className="text-base leading-5 text-[#a9acb4]">{hint}</p>
      {name && <p className="text-sm leading-5 font-medium text-primary">Selected: {name}</p>}
      <input
        ref={input}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => take(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="mt-2 rounded-2xl border-2 border-[#cbd0dc] bg-white px-8 py-4 text-base leading-[22px] font-bold text-[#54575c] hover:bg-gray-50"
      >
        Browse File
      </button>
    </div>
  );
}

/** Wide cover-image picker from the "Create New Program" basic details step. */
export function ImageDrop({ id }: { id: string }) {
  const [name, setName] = useState<string>();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-10 text-center text-slate-700 hover:bg-gray-50"
    >
      <ImageIcon aria-hidden className="size-10" />
      <span className="text-base leading-6 font-medium">{name ?? "Click to upload cover image"}</span>
      <span className="text-sm leading-5 font-medium">PNG, JPG up to 10MB</span>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => setName(e.target.files?.[0]?.name)}
      />
    </label>
  );
}

/** Editable bullet list with "Add More" (What You'll Get / Learn, Expected Outcomes). */
export function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm leading-5 text-gray-900">{label} *</legend>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <input
            id={`${id}-${i}`}
            aria-label={`${label} item ${i + 1}`}
            value={item}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            className="h-9 flex-1 rounded-lg border border-stroke px-3 text-sm leading-6 text-slate-700 focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            aria-label={`Remove ${label} item ${i + 1}`}
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="grid size-8 place-items-center rounded text-danger hover:bg-red-50"
          >
            <Trash2 aria-hidden className="size-5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="flex h-[30px] items-center justify-center gap-3 rounded-lg border border-primary text-sm leading-5 text-slate-900 hover:bg-primary-soft"
      >
        <Plus aria-hidden className="size-4" />
        Add More
      </button>
    </fieldset>
  );
}

/** Cancel + violet primary action pinned under every Manage Programs modal. */
export function ModalActions({
  submitLabel,
  onCancel,
  cancelLabel = "Cancel",
  formId,
}: {
  submitLabel: string;
  onCancel: () => void;
  cancelLabel?: string;
  formId: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="h-11 rounded-lg border border-gray-300 px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={formId}
        className="h-11 rounded-lg bg-accent px-6 text-sm leading-5 font-semibold text-white hover:bg-accent/90"
      >
        {submitLabel}
      </button>
    </div>
  );
}

/** Small square icon button (edit / delete / preview) used across module rows. */
export function IconButton({
  label,
  tone = "blue",
  size = "sm",
  onClick,
  children,
}: {
  label: string;
  tone?: "blue" | "red" | "green" | "primary";
  size?: "sm" | "md";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const tones = {
    blue: "text-blue-600 hover:bg-blue-50",
    red: "text-red-600 hover:bg-red-50",
    green: "text-green-600 hover:bg-green-50",
    primary: "text-primary hover:bg-primary-soft",
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid shrink-0 place-items-center",
        size === "sm" ? "size-[26px] rounded" : "size-8 rounded-lg",
        tones[tone],
      )}
    >
      {children}
    </button>
  );
}
