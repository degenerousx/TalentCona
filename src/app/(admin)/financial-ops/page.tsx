import type { Metadata } from "next";
import FinancialOps from "./_components/FinancialOps";

export const metadata: Metadata = {
  title: "Financial Ops · TalentCona",
};

export default function FinancialOpsPage() {
  return <FinancialOps />;
}
