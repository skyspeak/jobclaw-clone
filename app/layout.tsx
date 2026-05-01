import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DearCC presents JobClaw",
  description: "A hosted chat intake UI for the JobClaw search request flow.",
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
