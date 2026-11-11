/**
 * Ambassador Management types, plus SAMPLE data for the parts the backend has
 * no admin endpoints for yet: the ambassador list, the stat cards and the
 * commission chart. The page labels these as sample data. Payout requests
 * are live (see api.ts).
 */

export type AmbassadorStatus = "active" | "payout-due" | "inactive";

export type Ambassador = {
  id: string;
  name: string;
  email: string;
  students: number;
  /** Amounts in naira (major units). */
  studentPayments: number;
  commission: number;
  /** Commission rate in percent. */
  rate: number;
  withdrawn: number;
  available: number;
  status: AmbassadorStatus;
  joined: string;
  referralCode: string;
};

export type PayoutStatus = "PendingOtp" | "Pending" | "Approved" | "Rejected" | "Disbursed";

export type PayoutRequest = {
  id: string;
  name: string;
  email: string;
  /** Formatted, e.g. "₦50,000". */
  amount: string;
  amountValue: number;
  bank: string;
  accountName: string;
  /** Masked, e.g. "•••• 4375". */
  account: string;
  status: PayoutStatus;
  note: string;
  reviewNote: string;
  requestedAt: string;
};

export const statusLabel: Record<AmbassadorStatus, string> = {
  active: "Active",
  "payout-due": "Payout due",
  inactive: "Inactive",
};

export const naira = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`;

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// ---- Sample data (no backend endpoints yet) ---------------------------------

export const sampleStats = [
  { key: "ambassadors", label: "Total ambassadors", value: "128", note: "vs last month", trend: "+12.4%" },
  { key: "students", label: "Students referred", value: "1,284", note: "186 this month", trend: "+18.2%" },
  { key: "revenue", label: "Referral revenue", value: naira(486240), note: "Total student payments", trend: "+9.6%" },
  { key: "commission", label: "Commission earned", value: naira(48624), note: "Commission rate", trend: "10%" },
] as const;

/** Earned vs paid out, per month, oldest first (last 12 months). */
export const sampleCommission = [
  { month: "Jun", earned: 2900, paid: 2100 },
  { month: "Jul", earned: 3300, paid: 2500 },
  { month: "Aug", earned: 3100, paid: 2600 },
  { month: "Sep", earned: 3800, paid: 3000 },
  { month: "Oct", earned: 4100, paid: 3200 },
  { month: "Nov", earned: 3900, paid: 3400 },
  { month: "Dec", earned: 4200, paid: 3100 },
  { month: "Jan", earned: 5100, paid: 3600 },
  { month: "Feb", earned: 4800, paid: 4000 },
  { month: "Mar", earned: 6200, paid: 4800 },
  { month: "Apr", earned: 5700, paid: 4600 },
  { month: "May", earned: 6900, paid: 5200 },
];

const people: Array<[string, string, number, number, number, AmbassadorStatus]> = [
  ["Nana Ama Mensah", "nana.mensah@gmail.com", 38, 54200, 3200, "active"],
  ["Kwame Owusu", "kwame.owusu@gmail.com", 31, 46800, 4000, "active"],
  ["Akosua Boateng", "akosua.b@gmail.com", 24, 36900, 2500, "payout-due"],
  ["Daniel Asare", "daniel.asare@gmail.com", 19, 28600, 1500, "active"],
  ["Efua Sarpong", "efua.sarpong@gmail.com", 16, 22400, 1000, "active"],
  ["Joseph Annan", "j.annan@gmail.com", 13, 18750, 1200, "inactive"],
  ["Adwoa Darko", "adwoa.darko@gmail.com", 12, 17400, 900, "active"],
  ["Yaw Ofori", "yaw.ofori@gmail.com", 11, 15950, 1100, "payout-due"],
  ["Esi Quaye", "esi.quaye@gmail.com", 9, 13050, 600, "active"],
  ["Kofi Badu", "kofi.badu@gmail.com", 8, 11600, 1000, "inactive"],
  ["Abena Frimpong", "abena.f@gmail.com", 7, 10150, 400, "active"],
  ["Kojo Ampofo", "kojo.ampofo@gmail.com", 6, 8700, 500, "active"],
];

export const sampleAmbassadors: Ambassador[] = people.map(([name, email, students, payments, withdrawn, status], i) => {
  const commission = Math.round(payments * 0.1);
  return {
    id: `amb-${i + 1}`,
    name,
    email,
    students,
    studentPayments: payments,
    commission,
    rate: 10,
    withdrawn,
    available: Math.max(0, commission - withdrawn),
    status,
    joined: new Date(2025, (i * 2) % 12, 3 + i).toISOString(),
    referralCode: `TC${name.split(" ")[0].toUpperCase().slice(0, 4)}${String(1000 + i * 37)}`,
  };
});
