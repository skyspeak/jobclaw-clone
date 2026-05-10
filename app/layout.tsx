import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DearCC presents JobClaw",
  description: "Landing, turn-taking intake, and DearCC-hosted experiences aligned to JobClaw's design system.",
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
