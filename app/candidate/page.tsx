import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { Chat } from "@/app/components/lead-gen/Chat";
import { LeadGenThemeProvider } from "@/app/components/lead-gen/LeadGenThemeProvider";

export const metadata: Metadata = {
  title: "dear[CC] helps you get your first job",
  description: "Get your first job with AI-native skills. Chat your way in with dear[CC].",
};

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export default function CandidatePage() {
  return (
    <LeadGenThemeProvider className={geistMono.className}>
      <Chat />
    </LeadGenThemeProvider>
  );
}
