import { LaptopsProvider } from "./_components/LaptopsStore";

/** Shares the laptop inventory between the list, add and edit pages. */
export default function LaptopsLayout({ children }: { children: React.ReactNode }) {
  return <LaptopsProvider>{children}</LaptopsProvider>;
}
