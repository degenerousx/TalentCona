import type { Metadata } from "next";
import ReferralsContent from "./_components/ReferralsContent";

export const metadata: Metadata = {
  title: "Referral & Commission",
  description: "Manage viral growth, referral earnings, withdrawals, and commission settings.",
};

export default function ReferralsPage() {
  return <ReferralsContent />;
}
