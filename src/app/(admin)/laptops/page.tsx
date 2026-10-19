import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { LaptopsView } from "./_components/LaptopsView";

export const metadata = {
  title: "Laptops",
  description: "Manage Talent Cona laptop inventory, pricing, and publication status.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Laptops" description="Manage transactions, wallets, and loan repayments" />
        <Link href="/laptops/new" className={buttonClasses({ size: "sm", className: "h-10 px-4 font-semibold" })}>
          Add Laptop
        </Link>
      </div>
      <LaptopsView />
    </div>
  );
}
