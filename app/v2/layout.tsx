import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";

import { V2_THEME_CLASS } from "@/lib/v2/v2-theme";

import "../globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--v2-font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dear [CC] Career Coach — v2",
  description:
    "Turn a rejection into a roadmap. Paste the job and your LinkedIn — we find the gap and build your plan.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${V2_THEME_CLASS} ${sourceSerif.variable} min-h-dvh`}>{children}</div>
  );
}
