import type { Metadata } from "next";
import { Outfit, Noto_Color_Emoji } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const notoEmoji = Noto_Color_Emoji({
  subsets: ["emoji"],
  weight: "400",
  variable: "--font-emoji",
});

export const metadata: Metadata = {
  title: "TalentCona",
  description: "TalentCona — connecting talent with opportunity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${notoEmoji.variable}`}>
      <body>{children}</body>
    </html>
  );
}
