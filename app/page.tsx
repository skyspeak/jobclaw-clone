import { Geist_Mono } from "next/font/google";

import { Landing } from "@/app/components/Landing";
import { LeadGenThemeProvider } from "@/app/components/lead-gen/LeadGenThemeProvider";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export default function Home() {
  return (
    <LeadGenThemeProvider className={geistMono.className}>
      <Landing />
    </LeadGenThemeProvider>
  );
}
