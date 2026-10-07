import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

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
      <ResetPasswordForm />
    </AuthShell>
  );
}
