import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password · TalentCona",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      illustration={{ src: "/images/forgot-password-illustration.webp", width: 1142, height: 1222 }}
      cardTop={354}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
