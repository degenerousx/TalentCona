// Placeholder finance figures from the design until the finance API exists.

export type TxStatus = "Completed" | "Restricted" | "Pending";

export type Transaction = {
  id: string;
  type: string;
  user: string;
  amount: number;
  method: string;
  date: string;
  status: TxStatus;
};

export type Withdrawal = { id: string; user: string; amount: number; date: string; status: TxStatus };

export const FINANCE_STATS = {
  revenueMtd: 76240,
  revenueMtdChange: 18,
  revenueYtd: 342800,
  revenueYtdChange: 24,
  availableFunds: 48500,
  restrictedFunds: 23800,
  pendingPayouts: 1245,
  pendingRequests: 3,
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Monthly revenue and expenses (USD), read off the design's chart. */
export const REVENUE = [42000, 48000, 55000, 61000, 68000, 76000];
export const EXPENSES = [28000, 31000, 34000, 37000, 41000, 45000];

export const TRANSACTIONS: Transaction[] = [
  { id: "tx-1", type: "Payment", user: "Sarah Johnson", amount: 500, method: "Stripe", date: "2024-02-16", status: "Completed" },
  { id: "tx-2", type: "Mentor Payout", user: "Dr. James Wilson", amount: 350, method: "Bank Transfer", date: "2024-02-15", status: "Completed" },
  { id: "tx-3", type: "Fundraising", user: "Adebayo Ojo", amount: 150, method: "Platform", date: "2024-02-14", status: "Restricted" },
  { id: "tx-4", type: "Loan Disbursement", user: "Michael Chen", amount: 1200, method: "Restricted Wallet", date: "2024-02-13", status: "Completed" },
  { id: "tx-5", type: "Referral Reward", user: "Emily Rodriguez", amount: 25, method: "Paystack", date: "2024-02-12", status: "Pending" },
];

export const WITHDRAWALS: Withdrawal[] = [
  { id: "wd-1", user: "Sarah Johnson", amount: 500, date: "2024-02-16", status: "Completed" },
  { id: "wd-2", user: "Dr. James Wilson", amount: 350, date: "2024-02-15", status: "Completed" },
  { id: "wd-3", user: "Adebayo Ojo", amount: 150, date: "2024-02-14", status: "Restricted" },
  { id: "wd-4", user: "Michael Chen", amount: 1200, date: "2024-02-13", status: "Completed" },
  { id: "wd-5", user: "Emily Rodriguez", amount: 25, date: "2024-02-12", status: "Pending" },
];

export type WalletLine = { label: string; amount: number };

export const WALLETS = {
  available: {
    title: "Available Wallet",
    total: 48500,
    lines: [
      { label: "Student Payments", amount: 38200 },
      { label: "Other Revenue", amount: 1900 },
    ] as WalletLine[],
  },
  restricted: {
    title: "Restricted Wallet",
    total: 23800,
    lines: [
      { label: "Fundraising Funds", amount: 12400 },
      { label: "Referral Disbursements", amount: 11400 },
    ] as WalletLine[],
    note: "These funds are earmarked for specific purposes",
  },
};

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export type LoanStatus = "Pending" | "Approved" | "Rejected" | "In Repayment" | "Fully Paid";

export type Loan = {
  id: string;
  student: string;
  program: string;
  amount: number;
  provider: string;
  date: string;
  status: LoanStatus;
  approvalDate?: string;
};

/** Current loan requests (the "All Requests" list in the design). */
export const LOAN_REQUESTS: Loan[] = [
  { id: "ln-1", student: "Michael Chen", program: "Full-Stack Development", amount: 1200, provider: "External Partner A", date: "2024-01-15", status: "Pending" },
  { id: "ln-2", student: "David Kim", program: "Data Science", amount: 950, provider: "External Partner B", date: "2024-01-20", status: "Approved", approvalDate: "2024-01-25" },
  { id: "ln-3", student: "Lisa Chang", program: "UI/UX Design", amount: 1100, provider: "External Partner A", date: "2024-01-18", status: "Rejected" },
  { id: "ln-4", student: "Sarah Johnson", program: "Full-Stack Development", amount: 1500, provider: "External Partner C", date: "2024-02-01", status: "Approved", approvalDate: "2024-02-05" },
  { id: "ln-5", student: "James Wilson", program: "Mobile Development", amount: 1300, provider: "External Partner B", date: "2024-02-10", status: "Pending" },
];

/** Disbursed loans the partners report on: being repaid, or settled (dates are the last payment). */
export const LOAN_REPAYMENTS: Loan[] = [
  { id: "rp-1", student: "David Kim", program: "Data Science", amount: 950, provider: "External Partner B", date: "2024-03-01", status: "In Repayment" },
  { id: "rp-2", student: "Sarah Johnson", program: "Full-Stack Development", amount: 1500, provider: "External Partner C", date: "2024-03-05", status: "In Repayment" },
  { id: "rp-3", student: "Adebayo Ojo", program: "UI/UX Design", amount: 800, provider: "External Partner A", date: "2023-12-20", status: "Fully Paid" },
  { id: "rp-4", student: "Emily Rodriguez", program: "Intro to Programming", amount: 600, provider: "External Partner C", date: "2023-11-30", status: "Fully Paid" },
];
