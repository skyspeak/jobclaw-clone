import Link from "next/link";

import { RampAdoptionChart } from "@/app/components/RampAdoptionChart";

export default function AiAdoptionPage() {
  return (
    <main className="page">
      <section className="main-stack">
        <Link className="button secondary back-link" href="/">
          Back to chat
        </Link>
        <RampAdoptionChart />
      </section>
    </main>
  );
}
