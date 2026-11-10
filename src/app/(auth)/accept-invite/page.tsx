import type { Metadata } from "next";
import { Suspense } from "react";
import AcceptInviteForm from "../_components/AcceptInviteForm";
import AuthShell from "../_components/AuthShell";

export const metadata: Metadata = {
  title: "Accept Invitation · TalentCona",
};

/** The invitation email links here: /accept-invite?token=… */
export default function AcceptInvitePage() {
  return (
    <AuthShell
      illustration={{ src: "/images/forgot-password-illustration.webp", width: 1142, height: 1222 }}
      cardTop={303}
      cardHeight={417.99}
    >
      {/* AcceptInviteForm reads ?token= (useSearchParams), which needs a Suspense boundary. */}
      <Suspense>
        <AcceptInviteForm />
      </Suspense>
    </AuthShell>
  );
}
