import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "../_components/AuthShell";
import ResetPasswordForm from "../_components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password · TalentCona",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      illustration={{ src: "/images/forgot-password-illustration.webp", width: 1142, height: 1222 }}
      cardTop={303}
      cardHeight={417.99}
    >
      {/* ResetPasswordForm reads ?token= (useSearchParams), which needs a Suspense boundary. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
