import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignInForm from "@/components/auth/SignInForm";

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
      <SignInForm />
    </AuthShell>
  );
}
