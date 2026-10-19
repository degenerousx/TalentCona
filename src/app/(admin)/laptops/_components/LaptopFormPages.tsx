"use client";

import Link from "next/link";
import { emptyDraft, toDraft } from "./data";
import { LaptopWizard } from "./LaptopWizard";
import { useLaptops } from "./LaptopsStore";

/** /laptops/new */
export function AddLaptop() {
  const { add } = useLaptops();
  return <LaptopWizard mode="create" initial={emptyDraft} onSave={add} />;
}

/** /laptops/[laptopId]/edit — looked up client-side because the inventory lives in the store. */
export function EditLaptop({ id }: { id: string }) {
  const { laptops, update } = useLaptops();
  const laptop = laptops.find((l) => l.id === id);

  if (!laptop) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg bg-white p-10">
        <h1 className="text-xl font-bold text-slate-900">Laptop not found</h1>
        <p className="text-sm text-slate-500">It may have been deleted, or the link is out of date.</p>
        <Link href="/laptops" className="text-sm font-semibold text-primary hover:underline">
          ← Back to Laptops
        </Link>
      </div>
    );
  }

  return (
    <LaptopWizard
      key={laptop.id}
      mode="edit"
      initial={toDraft(laptop)}
      onSave={(draft, status) => update(laptop.id, draft, status)}
    />
  );
}
