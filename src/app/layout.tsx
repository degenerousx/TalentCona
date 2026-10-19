import type { Metadata } from "next";
import { Noto_Color_Emoji, Outfit } from "next/font/google";
import ImageGuard from "@/components/layout/ImageGuard";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// The 👋 in the Dashboard and auth headings.
const notoEmoji = Noto_Color_Emoji({
  variable: "--font-emoji",
  subsets: ["emoji"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Talent Cona Admin",
  description: "Talent Cona admin portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The app shell is one viewport tall (see (admin)/layout.tsx): the document
    // itself never scrolls, only the scroll boxes inside it. h-dvh there plus
    // overflow-clip here means there is no leftover height to scroll into.
    <html lang="en" className={`${outfit.variable} ${notoEmoji.variable} h-full overflow-clip antialiased`}>
      <body className="h-full overflow-clip">
        <ImageGuard />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
