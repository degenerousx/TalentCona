import Image from "next/image";
import { Icon } from "./AppIcon";
import { AdminAvatar } from "./CurrentAdmin";

export default function Header() {
  return (
    <header className="flex h-[86px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <Image src="/logo.png" alt="Talent Cona" width={124} height={48} priority />
      <div className="flex items-center gap-5">
        <button type="button" aria-label="Notifications" className="text-slate-900">
          <Icon icon="mdi:bell-outline" className="size-6" />
        </button>
        <AdminAvatar />
      </div>
    </header>
  );
}
