import Link from "next/link";

import { MicroInternshipsProgram } from "@/app/components/MicroInternshipsProgram";

export default function MicroInternshipsPage() {
  return (
    <main className="page">
      <section className="main-stack micro-internships-page">
        <Link className="button secondary back-link" href="/">
          Back to chat
        </Link>
        <MicroInternshipsProgram />
      </section>
    </main>
  );
}
