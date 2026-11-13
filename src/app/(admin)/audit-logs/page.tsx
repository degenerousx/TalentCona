import type { Metadata } from "next";
import { AuditLogsView } from "./_components/AuditLogsView";

export const metadata: Metadata = {
  title: "Audit & System Logs · TalentCona",
  description: "Monitor platform activity, administrative changes, and security events.",
};

export default function AuditLogsPage() {
  return <AuditLogsView />;
}
