import type { Metadata } from "next";
import UserManagement from "./_components/UserManagement";

export const metadata: Metadata = {
  title: "User Management · TalentCona",
};

export default function UserManagementPage() {
  return <UserManagement />;
}
