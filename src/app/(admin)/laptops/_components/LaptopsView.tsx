"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil, Search, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatNaira, specChips, type Laptop, type LaptopStatus } from "./data";
import { useLaptops } from "./LaptopsStore";

type SortKey = "updated" | "brand" | "amount";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Last updated",
  brand: "Brand",
  amount: "Amount",
};

const statusStyles: Record<LaptopStatus, string> = {
  Published: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Draft: "bg-gray-100 text-gray-700",
};

/** Figma "Button" filters: slate-50 fill, gray-300 border, small chevron. */
function FilterSelect({
  label,
  prefix,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9.5 w-full appearance-none rounded-lg border border-gray-300 bg-slate-50 pr-8 pl-3 text-sm leading-5 text-slate-700 focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {prefix}: {labels?.[o] ?? o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-slate-700"
      />
    </div>
  );
}

/** Laptop inventory table (Figma 293:29070). */
export function LaptopsView() {
  const { laptops, remove } = useLaptops();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState<SortKey>("updated");
  const [deleting, setDeleting] = useState<Laptop | null>(null);

  const brandOptions = useMemo(() => [...new Set(laptops.map((l) => l.brand))].sort(), [laptops]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return laptops
      .filter(
        (l) =>
          (!q || [l.brand, l.model, l.deviceName, ...specChips(l)].join(" ").toLowerCase().includes(q)) &&
          (status === "All" || l.status === status) &&
          (brand === "All" || l.brand === brand),
      )
      .sort((a, b) =>
        sort === "brand"
          ? a.brand.localeCompare(b.brand)
          : sort === "amount"
            ? a.amount - b.amount
            : b.updated.localeCompare(a.updated),
      );
  }, [laptops, query, status, brand, sort]);

  const columns: Column<Laptop>[] = [
    {
      key: "brand",
      header: "Brand / Model",
      rowHeader: true,
      className: "min-w-40",
      render: (l) => (
        <>
          <span className="block text-sm leading-5 font-semibold text-slate-900">{l.brand}</span>
          <span className="block pt-0.5 text-xs leading-4 text-slate-700">{l.model}</span>
        </>
      ),
    },
    {
      key: "specs",
      header: "Specs",
      className: "min-w-44",
      render: (l) => (
        <span className="flex max-w-47.5 flex-wrap gap-1.5">
          {specChips(l).map((spec) => (
            <span
              key={spec}
              className="rounded border border-gray-300 bg-slate-50 px-2 py-0.5 text-xs leading-4 text-slate-500"
            >
              {spec}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (l) => <span className="font-semibold text-gray-900">{formatNaira(l.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs leading-4 font-medium", statusStyles[l.status])}>
          {l.status}
        </span>
      ),
    },
    { key: "updated", header: "Last Updated", render: (l) => <span className="text-gray-600">{l.updated}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (l) => (
        <span className="flex gap-2">
          <Link
            href={`/laptops/${l.id}/edit`}
            aria-label={`Edit ${l.brand} ${l.model}`}
            title="Edit laptop"
            className="grid size-8.5 place-items-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
          >
            <Pencil aria-hidden className="size-4.5" />
          </Link>
          <button
            type="button"
            aria-label={`Delete ${l.brand} ${l.model}`}
            title="Delete laptop"
            onClick={() => setDeleting(l)}
            className="grid size-8.5 place-items-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 aria-hidden className="size-4.5" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="relative w-full lg:max-w-127.25">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-700"
          />
          <input
            type="search"
            aria-label="Search laptops"
            placeholder="Search brand, model, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9.5 w-full rounded-lg border border-gray-300 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-700 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:gap-6">
          <FilterSelect
            label="Filter laptops by status"
            prefix="Status"
            value={status}
            onChange={setStatus}
            options={["All", "Published", "Pending", "Draft"]}
          />
          <FilterSelect
            label="Filter laptops by brand"
            prefix="Brand"
            value={brand}
            onChange={setBrand}
            options={["All", ...brandOptions]}
          />
          <FilterSelect
            label="Sort laptops"
            prefix="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={["updated", "brand", "amount"]}
            labels={SORT_LABELS}
          />
        </div>
      </div>

      {visible.length ? (
        <DataTable caption="Laptop inventory" columns={columns} rows={visible} rowKey={(l) => l.id} />
      ) : (
        <Card className="flex min-h-48 flex-col items-center justify-center gap-1 text-center" flat>
          <Search aria-hidden className="mb-2 size-7 text-muted" />
          <p className="text-sm leading-5 font-semibold text-gray-900">No laptops found</p>
          <p className="text-sm leading-5 text-slate-500">
            {laptops.length ? "Try changing your search or filters." : "Add a laptop to get started."}
          </p>
          {!laptops.length && (
            <Link href="/laptops/new" className={buttonClasses({ size: "md", className: "mt-3 font-semibold" })}>
              Add Laptop
            </Link>
          )}
        </Card>
      )}

      {deleting && (
        <Modal
          open
          size="sm"
          title={`Delete ${deleting.brand} ${deleting.model}?`}
          titleClassName="text-lg leading-7 text-gray-900"
          subtitle={
            <p className="mt-1 text-sm leading-5 text-slate-500">
              This laptop will be removed from the inventory. This action cannot be undone.
            </p>
          }
          onClose={() => setDeleting(null)}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="h-11 rounded-lg border border-gray-300 px-6 text-sm leading-5 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  remove(deleting.id);
                  setDeleting(null);
                }}
                className="h-11 rounded-lg bg-danger px-6 text-sm leading-5 font-semibold text-white hover:bg-danger/90"
              >
                Delete Laptop
              </button>
            </div>
          }
        >
          <p className="text-sm leading-5 text-slate-700">
            {deleting.deviceName || `${deleting.brand} ${deleting.model}`} · {formatNaira(deleting.amount)}
          </p>
        </Modal>
      )}
    </div>
  );
}
