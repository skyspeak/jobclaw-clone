import Link from "next/link";

import { ResumeTailor } from "@/app/components/ResumeTailor";

export default function TailorResumePage() {
  return (
    <main className="page">
      <nav className="home-nav" aria-label="Main links">
        <Link href="/">DearCC presents JobClaw</Link>
      </nav>
      <div className="main-stack">
        <ResumeTailor />
      </div>
    </main>
  );
}
