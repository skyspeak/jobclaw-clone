import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "JobClaw — Career signal, on demand",
  description:
    "For new graduates: the best internships, referrals, and offers come from understanding roles and people—not mass applying. Build a brief that moves real conversations forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
