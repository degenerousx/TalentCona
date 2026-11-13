import Image from "next/image";
import NotificationBell from "@/components/notifications/NotificationBell";
import { AdminAvatar, AdminIdentity } from "./CurrentAdmin";

export default function Header() {
  return (
    <header className="flex h-[86px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <Image src="/logo.png" alt="Talent Cona" width={124} height={48} priority />
      <div className="flex items-center gap-5">
        <NotificationBell />
        <span className="flex items-center gap-2.5">
          <AdminAvatar />
          <AdminIdentity />
        </span>
      </div>
    </header>
  );
}
