import Link from "next/link";

import { MicroInternshipsProgram } from "@/app/components/MicroInternshipsProgram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MicroInternshipsPage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav
        aria-label="Main links"
        className="mx-auto flex w-full max-w-6xl items-center px-6 py-6"
      >
        <Link className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
          dear[CC]
        </Link>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 pb-24 md:grid-cols-[1fr,minmax(260px,300px)] md:gap-5 md:px-8">
        <MicroInternshipsProgram />

        <aside aria-label="Extra experiences" className="flex flex-col gap-4">
          <Card className="border-border/70 shadow-sm md:sticky md:top-6 md:self-start md:rounded-2xl md:shadow-none">
            <CardHeader className="p-7 pb-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Turn-taking intake
              </p>
              <CardTitle className="text-lg">Answer the five dear[CC] prompts.</CardTitle>
              <CardDescription>
                Same chat flow this micro-internship walkthrough references — save answers before you
                run the matcher.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 pt-5">
              <Button variant="outline" asChild className="rounded-2xl">
                <Link href="/intake">Open intake chat</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm md:rounded-2xl">
            <CardHeader className="p-7 pb-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                AI readiness quiz
              </p>
              <CardTitle className="text-lg">Quick gut-check on verification habits.</CardTitle>
              <CardDescription>Five questions. Share your score after the walkthrough.</CardDescription>
            </CardHeader>
            <CardContent className="p-7 pt-5">
              <Button variant="outline" asChild className="rounded-2xl">
                <Link href="/quiz">Take the quiz</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm md:rounded-2xl">
            <CardHeader className="p-7 pb-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ramp data
              </p>
              <CardTitle className="text-lg">AI adoption by sector.</CardTitle>
              <CardDescription>Time-series chart sourced from Ramp.</CardDescription>
            </CardHeader>
            <CardContent className="p-7 pt-5">
              <Button variant="outline" asChild className="rounded-2xl">
                <Link href="/ai-adoption">View chart</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
