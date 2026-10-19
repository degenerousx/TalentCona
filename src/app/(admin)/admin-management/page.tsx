import type { Metadata } from "next";
import AdminManagementContent from "./_components/AdminManagementContent";

export const metadata: Metadata = {
  title: "Admin Management",
  description: "Invite and manage Talent Cona administrative team members.",
};

export default function AdminManagementPage() {
  return <AdminManagementContent />;
}
