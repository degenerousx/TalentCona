import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "../_components/AuthShell";
import SignInForm from "../_components/SignInForm";

export const metadata: Metadata = {
  title: "Sign In · TalentCona",
};

export default function SignInPage() {
  return (
    <AuthShell
      illustration={{ src: "/images/signin-illustration.webp", width: 1138, height: 1134 }}
      cardTop={206.85}
      cardHeight={701.31}
    >
      {/* SignInForm reads ?next= (useSearchParams), which needs a Suspense boundary. */}
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
