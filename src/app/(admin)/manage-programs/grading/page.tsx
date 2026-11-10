import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GradingView } from "../_components/GradingView";

export const metadata = { title: "Grading · Manage Programs" };

export default function GradingPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/manage-programs" className="self-start rounded text-base leading-6 font-semibold text-slate-900 hover:text-primary">
        <span aria-hidden="true">← </span>Back<span className="sr-only"> to Manage Programs</span>
      </Link>
      <PageHeader title="Grading" description="Set each program's grading rubrics. Mentors score against them and the backend calculates every grade." />
      <GradingView />
    </div>
  );
}
