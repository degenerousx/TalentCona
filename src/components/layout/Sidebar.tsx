"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./AppIcon";
import { NAV_ITEMS } from "@/config/navigation";
import { logout } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useSession } from "@/lib/session";

// Logout icon exported from Figma (library icon "Icon=Logout", not on Iconify).
const LOGOUT_ICON = {
  width: 24,
  height: 24,
  body: '<path d="M10 12L19 12M17 14L19 12L17 10M15 16L15 19C15 20.1046 14.1046 21 13 21L7 21C5.89543 21 5 20.1046 5 19L5 5C5 3.89543 5.89543 3 7 3L13 3C14.1046 3 15 3.89543 15 5L15 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const activeRef = useRef<HTMLElement | null>(null);
  // Callback ref so the same ref works for both the <Link> and <div> branches.
  const setActiveRef = (el: HTMLElement | null) => {
    activeRef.current = el;
  };

  const navRef = useRef<HTMLElement | null>(null);

  // The menu is taller than the viewport on short screens, so the current item
  // can sit below the fold — bring it back into view by scrolling the nav box
  // itself. Never scrollIntoView(): that also scrolls every ancestor scroll
  // box, including the overflow-hidden shell and the document, which slides the
  // header off-screen and leaves blank space with no scrollbar to undo it.
  useEffect(() => {
    const nav = navRef.current;
    const item = activeRef.current;
    if (!nav || !item) return;
    const top = item.offsetTop - nav.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight;
  }, [pathname, collapsed]);

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-[#efefef] bg-white py-8 transition-[width] duration-200 ${
        collapsed ? "w-24" : "w-70"
      }`}
    >
      {/* Menu scrolls on short screens; Logout below stays fixed at the bottom. */}
      <nav ref={navRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 scrollbar-thin">
        {/* Only modules this admin has the privilege for (pages are blocked too — see RequirePrivilege). */}
        {NAV_ITEMS.filter((item) => !item.privilege || can(session, item.privilege)).map((item) => {
          const active = pathname.startsWith(item.href);
          const className = `flex h-14 shrink-0 items-center gap-4 rounded-lg px-4 text-base transition-colors ${
            collapsed ? "justify-center" : ""
          } ${
            active
              ? "bg-primary font-semibold text-white"
              : "text-slate-900 hover:bg-slate-100"
          } ${item.enabled ? "" : "cursor-default"}`;

          const content = (
            <>
              <Icon icon={item.icon} className="size-6 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </>
          );

          // Disabled items render as plain elements so clicking does nothing.
          return item.enabled ? (
            <Link
              key={item.href}
              ref={active ? setActiveRef : undefined}
              href={item.href}
              className={className}
              title={item.label}
            >
              {content}
            </Link>
          ) : (
            <div
              key={item.href}
              ref={active ? setActiveRef : undefined}
              className={className}
              title={item.label}
              aria-disabled="true"
            >
              {content}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 px-5 pt-6">
        <button
          type="button"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            // Never throws: the local session is cleared even if the server can't be
            // reached, and the sign-in page then says so.
            await logout();
            router.replace("/sign-in");
          }}
          className={`flex h-14 w-full items-center gap-4 rounded-lg bg-danger px-4 text-base text-white disabled:opacity-70 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon icon={LOGOUT_ICON} className="size-6 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-60 -right-4 z-10 flex size-10 items-center justify-center rounded-full bg-primary text-white"
      >
        <Icon icon="cuida:sidebar-collapse-outline" className="size-6" />
      </button>
    </aside>
  );
}
