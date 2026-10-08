import type { Metadata } from "next";
import FinancialOps from "@/components/finance/FinancialOps";

export const metadata: Metadata = {
  title: "Financial Ops · TalentCona",
};

export default function FinancialOpsPage() {
  return <FinancialOps />;
}
