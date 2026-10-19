import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found · TalentCona" };

/** Shown for unknown routes and for ids (students, mentors, programs) that don't exist. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-page px-4 py-8 text-center">
      <Image src="/images/talentcona-logo.png" alt="TalentCona" width={124} height={48} priority />
      <p className="mt-6 text-[56px] leading-none font-bold text-brand">404</p>
      <h1 className="text-2xl leading-8 font-semibold text-heading">Page not found</h1>
      <p className="max-w-[360px] text-base leading-6 text-muted-foreground">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-3 rounded-lg bg-brand px-6 py-2.5 text-base leading-6 font-medium text-white hover:bg-[#252078] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5a0e0]"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
