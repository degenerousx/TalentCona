import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In · TalentCona",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
