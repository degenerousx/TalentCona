"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { brands, processors, programs, type LaptopDraft, type LaptopStatus, type StorageType } from "./data";

/**
 * "Add Laptop" / "Edit Laptop" — two steps with a progress bar
 * (Figma 293:29293, 293:29967 and the Edit variants 293:29630, 293:30298).
 */

const steps = ["Basic Details", "Specifications"] as const;

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

function Select({
  options,
  placeholder,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder: string }) {
  return (
    <div className="relative">
      <select className={cn(control, "h-10.25 appearance-none pr-10", className)} {...props}>
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

function CoverDrop({ id, value, onChange }: { id: string; value?: string; onChange: (name: string) => void }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-10 text-center text-slate-700 focus-within:border-primary hover:border-primary"
    >
      <ImageIcon aria-hidden className="size-12" strokeWidth={1.5} />
      <span className="text-base leading-6 font-medium">{value ?? "Click to upload cover image"}</span>
      <span className="text-sm leading-5 font-medium">{value ? "Click to replace" : "PNG, JPG up to 10MB"}</span>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file.name);
        }}
      />
    </label>
  );
}

export function LaptopWizard({
  mode,
  initial,
  onSave,
}: {
  mode: "create" | "edit";
  initial: LaptopDraft;
  onSave: (draft: LaptopDraft, status: LaptopStatus) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const [draftError, setDraftError] = useState(false);
  const last = step === steps.length - 1;
  const title = mode === "create" ? "Add Laptop" : "Edit Laptop";

  const set =
    <K extends keyof LaptopDraft>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: e.target.value });

  const finish = (status: LaptopStatus) => {
    onSave(draft, status);
    router.push("/laptops");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (last) finish("Published");
    else setStep(step + 1);
  };

  // A draft only needs enough to find it again in the list.
  const saveDraft = () => {
    if (!draft.brand || !draft.model) {
      setDraftError(true);
      setStep(0);
      return;
    }
    finish("Draft");
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] leading-[1.3] font-bold text-slate-900 sm:text-[32px]">
        <Link
          href="/laptops"
          className="inline-flex items-center gap-2 rounded hover:text-primary"
          aria-label={`Back to Laptops — ${title}`}
        >
          <ArrowLeft aria-hidden className="size-7" />
          {title}
        </Link>
      </h1>

      {/* Step progress */}
      <nav aria-label="Laptop setup steps" className="flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}
          className="h-2 overflow-hidden rounded-full bg-white"
        >
          <div
            className="h-full rounded-full bg-success transition-[width]"
            style={{ width: step === 0 ? "24%" : "100%" }}
          />
        </div>
        <ol className="flex justify-between text-sm leading-5">
          {steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "rounded disabled:cursor-default",
                  i === step ? "text-primary" : i < step ? "text-slate-900 hover:underline" : "text-slate-900",
                )}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {step === 0 ? (
            <>
              {draftError && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                  Add at least a brand and model to save a draft.
                </p>
              )}
              <Field label="Brand" required>
                {(id) => (
                  <Select
                    id={id}
                    required
                    value={draft.brand}
                    onChange={set("brand")}
                    options={brands}
                    placeholder="Select a brand"
                  />
                )}
              </Field>
              <Field label="Model" required>
                {(id) => (
                  <input
                    id={id}
                    required
                    value={draft.model}
                    onChange={set("model")}
                    placeholder="XPS 13 Plus"
                    className={cn(control, "h-10.5")}
                  />
                )}
              </Field>
              <Field label="Device Name" required>
                {(id) => (
                  <input
                    id={id}
                    required
                    value={draft.deviceName}
                    onChange={set("deviceName")}
                    placeholder="e.g. XPS 13 Plus — Graphite"
                    className={cn(control, "h-10.5")}
                  />
                )}
              </Field>
              <Field label="Cover Image" required>
                {(id) => (
                  <CoverDrop id={id} value={draft.cover} onChange={(cover) => setDraft({ ...draft, cover })} />
                )}
              </Field>
              <Field label="Programs suitable for" required>
                {(id) => (
                  <Select
                    id={id}
                    required
                    value={draft.program}
                    onChange={set("program")}
                    options={programs}
                    placeholder="Select a program"
                  />
                )}
              </Field>
              <Field label="Amount" required>
                {(id) => (
                  <div className="flex h-9.5 overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <span aria-hidden className="grid place-items-center border-r border-gray-300 px-3 text-sm text-slate-700">
                      ₦
                    </span>
                    <input
                      id={id}
                      required
                      inputMode="numeric"
                      aria-label="Amount in naira"
                      placeholder="1,285,000"
                      value={draft.amount ? draft.amount.toLocaleString("en-NG") : ""}
                      onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value.replace(/\D/g, "")) })}
                      className="min-w-0 flex-1 px-3 text-sm text-slate-900 placeholder:text-gray-300 focus:outline-none"
                    />
                  </div>
                )}
              </Field>
            </>
          ) : (
            <>
              <Field label="Processor" required>
                {(id) => (
                  <Select
                    id={id}
                    required
                    value={draft.processor}
                    onChange={set("processor")}
                    options={processors}
                    placeholder="Intel Core i7-1360P"
                  />
                )}
              </Field>
              <Field label="RAM" required>
                {(id) => (
                  <input id={id} required value={draft.ram} onChange={set("ram")} placeholder="16GB" className={cn(control, "h-10.5")} />
                )}
              </Field>
              <Field label="Storage" required>
                {(id) => (
                  <input
                    id={id}
                    required
                    value={draft.storage}
                    onChange={set("storage")}
                    placeholder="512GB"
                    className={cn(control, "h-10.5")}
                  />
                )}
              </Field>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm leading-5 text-gray-900">Storage Type *</legend>
                <div className="grid w-full max-w-143.5 grid-cols-2 overflow-hidden rounded-lg border border-gray-300">
                  {(["SSD", "HDD"] as StorageType[]).map((type) => (
                    <label
                      key={type}
                      className={cn(
                        "cursor-pointer py-2 text-center text-sm leading-5 font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary/40",
                        draft.storageType === type ? "bg-primary text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="storageType"
                        value={type}
                        checked={draft.storageType === type}
                        onChange={() => setDraft({ ...draft, storageType: type })}
                        className="sr-only"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Screen Size">
                {(id) => (
                  <input id={id} value={draft.screenSize} onChange={set("screenSize")} placeholder='13.4"' className={cn(control, "h-10.5")} />
                )}
              </Field>
              <Field label="Resolution">
                {(id) => (
                  <input
                    id={id}
                    value={draft.resolution}
                    onChange={set("resolution")}
                    placeholder="1920 × 1200"
                    className={cn(control, "h-10.5")}
                  />
                )}
              </Field>
              <Field label="Operating System">
                {(id) => (
                  <input id={id} value={draft.os} onChange={set("os")} placeholder="Windows 11 Pro" className={cn(control, "h-10.5")} />
                )}
              </Field>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="h-11 rounded-lg border border-gray-300 bg-white px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary px-6 text-sm leading-5 font-semibold text-white hover:bg-primary/90"
          >
            {last ? "Publish Laptop" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
