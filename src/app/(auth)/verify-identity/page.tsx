import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "../_components/AuthShell";
import MfaForm from "../_components/MfaForm";

export const metadata: Metadata = {
  title: "Verify Identity · TalentCona",
};

export default function VerifyIdentityPage() {
  return (
    // Sign-in artwork and card size; there is no Figma frame for this screen yet.
    <AuthShell
      illustration={{ src: "/images/signin-illustration.webp", width: 1138, height: 1134 }}
      cardTop={206.85}
      cardHeight={701.31}
    >
      {/* MfaForm reads ?next= (useSearchParams), which needs a Suspense boundary. */}
      <Suspense>
        <MfaForm />
      </Suspense>
    </AuthShell>
  );
}
