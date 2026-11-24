"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { PAYMENTS, SPONSORS, usd, type Payment } from "./data";
import { Badge, Btn, Empty, Field, Input, Modal, Select, Toolbar, card, mockToast } from "./ui";

const STATUS = ["All", "Pending", "Confirmed"] as const;
const th = "bg-[#f9fafb]/60 px-4 py-3 text-left text-xs leading-4 font-semibold tracking-[0.6px] text-[#6a7282] uppercase";
const td = "px-4 py-3";

export function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("All");
  const [recording, setRecording] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => (status === "All" || p.status === status) && (!q || [p.reference, p.sponsor, p.talents, p.method].some((v) => v.toLowerCase().includes(q))));
  }, [payments, search, status]);

  return (
    <div className="flex flex-col gap-6">
      <Toolbar search={search} onSearch={setSearch} groups={[{ label: "Filter by status", options: STATUS, value: status, onChange: setStatus }]} />
      <Btn className="self-end px-4 py-2.5" onClick={() => setRecording(true)}>
        Record Payment
      </Btn>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <div className={cn(card, "overflow-x-auto")}>
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-[#f3f4f6]">
              <tr>
                {["Reference", "Sponsor", "Talent / Cohort", "Amount", "Method", "Date", "Status"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
                <th className={th}>
                  <span className="sr-only">Receipt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.reference} className="border-b border-[#f9fafb] last:border-0">
                  <td className={cn(td, "font-mono text-xs text-[#6a7282]")}>{p.reference}</td>
                  <td className={cn(td, "font-medium tracking-[-0.15px] text-[#101828]")}>{p.sponsor}</td>
                  <td className={cn(td, "text-xs text-[#4a5565]")}>{p.talents}</td>
                  <td className={cn(td, "font-bold text-[#101828]")}>{usd(p.amount)}</td>
                  <td className={cn(td, "text-xs text-[#4a5565]")}>{p.method}</td>
                  <td className={cn(td, "text-xs text-[#6a7282]")}>{p.date}</td>
                  <td className={td}>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className={td}>
                    <button type="button" aria-label={`Download receipt ${p.reference}`} onClick={mockToast} className="rounded-[8px] p-1.5 text-[#99a1af] hover:bg-slate-100">
                      <Download className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recording && (
        <RecordPayment
          onClose={() => setRecording(false)}
          onSave={(p) => {
            setPayments((ps) => [p, ...ps]);
            setRecording(false);
            toast.success(`Payment ${p.reference} recorded (design preview: nothing was saved)`);
          }}
        />
      )}
    </div>
  );
}

function RecordPayment({ onClose, onSave }: { onClose: () => void; onSave: (p: Payment) => void }) {
  const [sponsor, setSponsor] = useState("Select...");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [date, setDate] = useState("");
  const ready = sponsor !== "Select..." && reference.trim() && Number(amount) > 0 && date;
  return (
    <Modal
      open
      divided
      onClose={onClose}
      title="Record Payment"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={!ready}
            onClick={() => {
              const s = SPONSORS.find((x) => x.name === sponsor);
              onSave({ reference: reference.trim(), sponsor, talents: `${s?.talents ?? 0} students`, amount: Number(amount), method, date, status: "Confirmed" });
            }}
          >
            Record Payment
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-3 text-xs leading-4 text-[#1447e6]">Only record payments that have actually been received.</p>
        <Field label="Sponsor">
          <Select value={sponsor} onChange={(e) => setSponsor(e.target.value)} options={["Select...", ...SPONSORS.map((s) => s.name)]} />
        </Field>
        <Field label="Transaction Reference">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank ref or receipt no." />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <Select options={["USD"]} defaultValue="USD" />
          </Field>
          <Field label="Payment Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)} options={["Bank Transfer", "Wire Transfer", "Card", "Cheque"]} />
          </Field>
          <Field label="Transaction Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
