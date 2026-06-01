import type { Metadata } from "next";

import { BRAND_PAGE_TITLE } from "@/lib/brand";

import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_PAGE_TITLE,
  description:
    "For new graduates: the best internships, referrals, and offers come from understanding roles and people—not mass applying.",
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
