import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { LeadGenHome } from "@/app/components/lead-gen/LeadGenHome";

export const metadata: Metadata = {
  title: "dear[CC] helps you get your first job",
  description: "Get your first job with AI-native skills. Chat your way in with dear[CC].",
};

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-lead-gen-mono",
});

export default function CandidatePage() {
  return (
    <div className={`${geistMono.className} font-mono`}>
      <LeadGenHome />
    </div>
  );
}
