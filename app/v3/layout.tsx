import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";

import { V3_THEME_CLASS } from "@/lib/v3/v3-theme";

import "../globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--v3-font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dear [CC] Career Coach — Job Rejection Roadmap",
  description:
    "Turn a rejection into a roadmap. Paste the job and your LinkedIn — we find the gap and build your six-week plan.",
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${V3_THEME_CLASS} ${sourceSerif.variable} min-h-dvh`}>{children}</div>
  );
}
