import { FileText } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { FundraisingCampaign, LoanApplication, OnboardingApplicant } from "./data";

/** Bordered card that sits inside the tab container (no shadow). */
function ItemCard({ children, gap = "gap-4" }: { children: React.ReactNode; gap?: string }) {
  return <li className={`flex flex-col ${gap} rounded-lg border border-gray-200 p-6`}>{children}</li>;
}

type PersonHeadingProps = { name: string; meta: string; bold?: boolean; spaced?: boolean };

function PersonHeading({ name, meta, bold, spaced }: PersonHeadingProps) {
  return (
    <div className={`flex min-w-0 flex-col ${spaced ? "gap-1" : ""}`}>
      <h3 className={`text-lg leading-[27px] text-gray-900 ${bold ? "font-bold" : "font-semibold"}`}>{name}</h3>
      <p className="text-sm leading-5 break-words text-gray-600">{meta}</p>
    </div>
  );
}

type OnboardingCardProps = {
  applicant: OnboardingApplicant;
  onRemind: () => void;
  reminding: boolean;
};

export function OnboardingCard({ applicant, onRemind, reminding }: OnboardingCardProps) {
  return (
    <ItemCard>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PersonHeading name={applicant.name} meta={applicant.email} bold />
        {applicant.stuckFor && (
          <p className="flex items-center gap-1 text-sm leading-5 text-orange-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/admissions-routing/clock.svg" alt="" width={16} height={16} />
            {applicant.stuckFor}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 text-sm leading-5">
          <span className="text-gray-600">Current Stage: {applicant.stage}</span>
          <span className="text-gray-900">{applicant.progress}%</span>
        </div>
        <ProgressBar value={applicant.progress} label={`Onboarding progress for ${applicant.name}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" className="px-4" onClick={onRemind} disabled={reminding}>
          {reminding ? "Sending…" : "Send Reminder Email"}
          <span className="sr-only"> to {applicant.name}</span>
        </Button>
        <ButtonLink variant="outline" href={`/admissions-routing/${encodeURIComponent(applicant.id)}`} className="px-5">
          View Details<span className="sr-only"> for {applicant.name}</span>
        </ButtonLink>
      </div>
    </ItemCard>
  );
}

export function FundraisingCard({ campaign }: { campaign: FundraisingCampaign }) {
  return (
    <ItemCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PersonHeading name={campaign.name} meta={campaign.createdAgo} />
        {campaign.programs.length > 0 && (
          <dl className="text-sm leading-5">
            <dt className="text-slate-900">Program</dt>
            <dd className="text-highlight">{campaign.programs.join(", ")}</dd>
          </dl>
        )}
      </div>

      {campaign.story && (
        <blockquote className="rounded-lg bg-gray-50 p-4 text-sm leading-5 text-gray-700">
          &quot;{campaign.story}&quot;
        </blockquote>
      )}

      <div className="flex flex-col gap-2">
        <dl className="flex items-center justify-between gap-4 text-sm leading-5">
          <dt className="text-gray-600">Fundraising Goal</dt>
          <dd className="font-medium text-gray-900">{campaign.goal}</dd>
        </dl>
        <ProgressBar value={campaign.progress} label={`Funds raised for ${campaign.name}`} />
        <p className="text-xs leading-4 text-gray-600">
          {campaign.raised} raised · {campaign.progress}%
        </p>
      </div>
    </ItemCard>
  );
}

const loanTones: Record<string, PillTone> = {
  Pending: "pending",
  UnderReview: "info",
  Approved: "success",
  Disbursed: "success",
  Completed: "neutral",
  Rejected: "orange",
};

type LoanCardProps = {
  loan: LoanApplication;
  /** Shown only while the loan can still be reviewed. */
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
};

export function LoanCard({ loan, onApprove, onReject, busy }: LoanCardProps) {
  const reviewable = loan.rawStatus === "Pending" || loan.rawStatus === "UnderReview";
  const facts = [
    { label: "Total to Repay", value: loan.total, note: `${loan.interest} interest` },
    { label: "Monthly Payment", value: loan.monthly },
    { label: "Repayment Period", value: loan.period },
  ];

  return (
    <ItemCard gap="gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PersonHeading name={loan.name} meta={`Loan Amount: ${loan.amount}`} bold spaced />
        <Pill tone={loanTones[loan.rawStatus] ?? "neutral"} size="sm" className="font-normal">
          {loan.status}
        </Pill>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1 rounded-lg bg-gray-50 p-4">
            <dt className="text-xs leading-4 text-gray-600">{f.label}</dt>
            <dd className="text-base leading-6 font-bold text-gray-900">{f.value}</dd>
            {f.note && <dd className="text-xs leading-4 text-gray-600">{f.note}</dd>}
          </div>
        ))}
      </dl>

      {loan.items.length > 0 && (
        <p className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm leading-5 text-blue-900">
          <FileText aria-hidden className="size-5 shrink-0 text-blue-600" strokeWidth={1.67} />
          For: {loan.items.join(", ")}
        </p>
      )}

      {loan.reason && (
        <blockquote className="rounded-lg bg-gray-50 p-4 text-sm leading-5 text-gray-700">&quot;{loan.reason}&quot;</blockquote>
      )}

      {reviewable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" className="px-4" onClick={onApprove} disabled={busy}>
            Approve<span className="sr-only"> loan for {loan.name}</span>
          </Button>
          <Button variant="outline" className="px-5" onClick={onReject} disabled={busy}>
            Reject<span className="sr-only"> loan for {loan.name}</span>
          </Button>
        </div>
      )}
    </ItemCard>
  );
}
