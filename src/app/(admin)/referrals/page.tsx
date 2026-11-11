import type { Metadata } from "next";
import { ReferralsView } from "./_components/ReferralsView";

export const metadata: Metadata = {
  title: "Ambassador Management",
  description: "Manage ambassadors, student referrals, commissions, and payouts.",
};

export default function ReferralsPage() {
  return <ReferralsView />;
}
