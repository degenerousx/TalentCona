import type { Metadata } from "next";
import { Outfit, Noto_Color_Emoji, Open_Sans } from "next/font/google";
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

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "TalentCona",
  description: "TalentCona — connecting talent with opportunity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${notoEmoji.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
