"use client";

import { useCurrentAdmin } from "@/lib/currentAdmin";

/** Initials avatar for the signed-in admin (the API has no profile photos). */
export function AdminAvatar() {
  const { name, email, initials } = useCurrentAdmin();
  const label = name ?? email ?? "Signed-in admin";

  return (
    <span
      role="img"
      aria-label={label}
      title={name && email ? `${name} (${email})` : label}
      className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-light text-xs leading-4 font-bold text-accent-deep select-none"
    >
      {initials}
    </span>
  );
}

/** "Welcome, Ada! 👋" — or just "Welcome! 👋" when the name isn't available. */
export function WelcomeHeading({ className, emojiClassName }: { className?: string; emojiClassName?: string }) {
  const { name } = useCurrentAdmin();
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <h1 className={className}>
      {firstName ? `Welcome, ${firstName}!` : "Welcome!"} <span className={emojiClassName}>👋</span>
    </h1>
  );
}
