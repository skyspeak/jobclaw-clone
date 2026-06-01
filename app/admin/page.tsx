import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_COOKIE_NAME, isValidAdminPassword } from "@/lib/admin";
import { intakeQuestions } from "@/lib/jobclaw";
import { AdminJobFitSubmissions } from "@/app/components/AdminJobFitSubmissions";
import { AdminJobListings } from "@/app/components/AdminJobListings";
import { listJobFitSubmissions } from "@/lib/job-fit-submissions";
import { getDatabaseDiagnostics, getDatabaseErrorMessage } from "@/lib/db";
import { getJobListingsStoreLabel, listJobListings } from "@/lib/job-listings";
import { getSubmissionStoreLabel, listSubmissions } from "@/lib/submissions";
import type { JobListing } from "@/lib/job-listings";
import type { IntakeSubmission } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    password?: string | string[];
    token?: string | string[];
  }>;
};

async function signInAdmin(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");

  if (!isValidAdminPassword(password)) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

async function signOutAdmin() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;

  const queryPassword = getFirstParam(params.password) ?? getFirstParam(params.token);
  const cookieStore = await cookies();
  const cookiePassword = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidAdminPassword(queryPassword) && !isValidAdminPassword(cookiePassword)) {
    return (
      <main className="min-h-[100dvh] brand-bg px-4 py-10 sm:px-8">
        <nav aria-label="Main links" className="mx-auto mb-10 flex w-full max-w-3xl">
          <Link className="text-sm font-bold text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
            dear[CC]
          </Link>
        </nav>
        <section className="mx-auto grid w-full max-w-3xl gap-12">
          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-3 p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Administrator dashboard
              </p>
              <CardTitle className="text-3xl font-bold tracking-tight">Admin access required.</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Enter the admin password to view people, assessments, and contact information at this URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t border-border/60 px-10 pb-8 pt-8">
              <form action={signInAdmin} className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground" htmlFor="admin-password">
                    Password
                  </Label>
                  <Input
                    autoComplete="current-password"
                    className="h-11 rounded-xl"
                    id="admin-password"
                    name="password"
                    placeholder="Enter admin password"
                    type="password"
                  />
                </div>
                {getFirstParam(params.error) ? (
                  <p className="text-sm text-destructive">That password did not match.</p>
                ) : null}
                <Button type="submit" className="h-11 w-fit rounded-2xl cta-glow">
                  Open admin page
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  let submissions: IntakeSubmission[] = [];
  let jobListings: JobListing[] = [];
  let jobFitSubmissions: Awaited<ReturnType<typeof listJobFitSubmissions>> = [];
  let databaseError = "";

  try {
    submissions = await listSubmissions();
    jobListings = await listJobListings({ includeInactive: true });
    jobFitSubmissions = await listJobFitSubmissions();
  } catch (error) {
    console.error("Admin dashboard database error:", error);
    databaseError = getDatabaseErrorMessage(error);
  }

  const dbDiagnostics = getDatabaseDiagnostics();
  const submissionStoreLabel = getSubmissionStoreLabel();
  const jobListingsStoreLabel = getJobListingsStoreLabel();
  const contactedCount = submissions.filter(
    (submission) => submission.contact.name || submission.contact.email || submission.contact.phone,
  ).length;

  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-8 sm:px-8 md:pb-24">
      <nav
        aria-label="Main links"
        className="mx-auto mb-12 flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4"
      >
        <Link className="text-sm font-bold text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
          dear[CC]
        </Link>
        <form action={signOutAdmin}>
          <Button type="submit" variant="outline" className="rounded-2xl">
            Sign out
          </Button>
        </form>
      </nav>

      <section className="mx-auto grid w-full max-w-[1180px] gap-14">
        {databaseError ? (
          <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
            <CardHeader className="space-y-2 p-8">
              <CardTitle className="text-xl text-destructive">Database connection failed</CardTitle>
              <CardDescription className="text-base leading-relaxed text-foreground">
                {databaseError}
              </CardDescription>
              {dbDiagnostics.host ? (
                <p className="text-sm text-muted-foreground">
                  Configured host: <code className="text-foreground">{dbDiagnostics.host}</code>
                  {dbDiagnostics.port ? `:${dbDiagnostics.port}` : null}
                  {dbDiagnostics.source ? ` (from ${dbDiagnostics.source})` : null}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                In Vercel → Environment Variables: remove <strong>DATABASE_HOST</strong> /{" "}
                <strong>DATABASE_PASSWORD</strong> if you added them. Set only <strong>DATABASE_URL</strong> to the
                full <code>postgresql://…</code> string from Supabase → Settings → Database → Connection string →
                URI → <strong>Direct</strong>. Encode only the password, redeploy.
              </p>
            </CardHeader>
          </Card>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-5 p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Administrator dashboard
            </p>
            <CardTitle className="text-balance text-3xl font-bold tracking-tight sm:text-[2rem] md:text-[2.25rem]">
              People, assessments, and contact info.
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-relaxed">
              Review completed chat intakes, follow-up details, inferred roles, and profile assessments in one
              place.
            </CardDescription>
            <p className="text-sm font-medium text-muted-foreground">
              Storage: <span className="text-card-foreground">{submissionStoreLabel}</span>
            </p>
          </CardHeader>

          <CardContent className="border-t border-border/60 px-10 pb-10 pt-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard title="Total intakes" value={submissions.length} />
              <MetricCard title="With contact info" value={contactedCount} />
              <MetricCard
                title="With archetype"
                value={submissions.filter((submission) => submission.profileDraft?.archetype?.name).length}
              />
            </div>
          </CardContent>
        </Card>

        <AdminJobListings initialListings={jobListings} storeLabel={jobListingsStoreLabel} />

        <AdminJobFitSubmissions submissions={jobFitSubmissions} />

        {submissions.length > 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-2 border-b border-border/60 p-8 md:p-10">
              <CardTitle className="text-xl tracking-tight">All submissions</CardTitle>
              <CardDescription className="text-base">
                Contact info and a shortcut to each person&apos;s intake survey responses below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40">
                      <th className="px-5 py-3.5 font-semibold text-foreground md:px-8">Contact</th>
                      <th className="px-5 py-3.5 font-semibold text-foreground md:px-4">Email</th>
                      <th className="px-5 py-3.5 font-semibold text-foreground md:px-4">Phone</th>
                      <th className="px-5 py-3.5 font-semibold text-foreground md:px-8">Questions answered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => {
                      const answersAnchor = `intake-answers-${submission.id}`;
                      const displayName = submission.contact.name.trim() || "Unnamed person";
                      const submitted = new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(submission.createdAt));

                      return (
                        <tr
                          key={submission.id}
                          className="border-b border-border/55 last:border-0 odd:bg-card even:bg-muted/25"
                        >
                          <td className="max-w-[220px] px-5 py-4 align-top md:max-w-xs md:px-8">
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{submitted}</p>
                          </td>
                          <td className="max-w-[200px] break-all px-5 py-4 align-top md:px-4">
                            {submission.contact.email ? (
                              <a
                                className="text-foreground underline-offset-4 hover:underline"
                                href={`mailto:${submission.contact.email}`}
                              >
                                {submission.contact.email}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 align-top md:px-4">
                            {submission.contact.phone ? (
                              <a
                                className="text-foreground underline-offset-4 hover:underline"
                                href={`tel:${submission.contact.phone.replace(/\s/g, "")}`}
                              >
                                {submission.contact.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 align-top md:px-8">
                            <Link
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                              href={`#${answersAnchor}`}
                            >
                              View answers
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {submissions.length > 0 ? (
          <div className="grid gap-14">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-3xl border border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-col gap-12 border-border/55 p-10 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(submission.createdAt))}
                    </p>
                    <CardTitle className="mt-4 text-2xl">{submission.contact.name || "Unnamed person"}</CardTitle>
                    <CardDescription className="mt-3 text-base">{submission.result.summary}</CardDescription>
                  </div>
                  <Card className="w-full shrink-0 border-border/60 bg-muted/60 shadow-none md:max-w-sm">
                    <CardContent className="grid gap-2 p-8 text-base">
                      <p className="m-0 break-all font-medium">{submission.contact.email || "No email"}</p>
                      <p className="m-0 break-all">{submission.contact.phone || "No phone"}</p>
                    </CardContent>
                  </Card>
                </CardHeader>

                <div
                  className="scroll-mt-24 border-t border-border/55 px-10 py-14"
                  id={`intake-answers-${submission.id}`}
                >
                  <h3 className="mb-8 text-xl font-semibold tracking-tight">Intake survey answers</h3>
                  <div className="grid gap-5 md:gap-6">
                    {intakeQuestions.map((question) => (
                      <div className="rounded-2xl border border-border bg-muted/40 p-[18px]" key={question.id}>
                        <p className="m-0 text-[0.855rem] font-bold text-muted-foreground">{question.label}</p>
                        <p className="m-0 mt-2 text-[0.8rem] leading-relaxed text-muted-foreground/90">{question.prompt}</p>
                        <p className="m-0 mt-4 whitespace-pre-wrap text-[0.935rem] leading-relaxed text-foreground">
                          {submission.answers[question.id]?.trim() || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <CardContent className="grid gap-12 border-t border-border/55 px-10 py-14 md:grid-cols-2 md:divide-x md:divide-border/40 lg:divide-x lg:divide-border/35">
                  <section className="md:pr-10">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Assessment</h3>
                    <dl className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-4 gap-y-4 text-[0.875rem]">
                      <AssessmentRow dt="Archetype" dd={submission.profileDraft?.archetype?.name || "Not generated"} />
                      <AssessmentRow
                        dt="Ideal job"
                        dd={
                          submission.profileDraft?.idealJob?.title ||
                          submission.result.searchRequest?.jobTitle ||
                          "Not generated"
                        }
                      />
                      <AssessmentRow
                        dt="Headline"
                        dd={submission.profileDraft?.linkedInProfile?.headline || "Not generated"}
                      />
                      <AssessmentRow dt="Location" dd={submission.defaults.location || "Any"} />
                      <AssessmentRow dt="Work mode" dd={submission.defaults.workMode} />
                    </dl>
                  </section>

                  <section className="md:pl-12">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Contact on file</h3>
                    <dl className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-4 gap-y-4 text-[0.875rem]">
                      <AssessmentRow dt="Name" dd={submission.contact.name || "Not provided"} />
                      <AssessmentRow dt="Email" dd={submission.contact.email || "Not provided"} />
                      <AssessmentRow dt="Phone" dd={submission.contact.phone || "Not provided"} />
                      <AssessmentRow
                        dt="LinkedIn URL"
                        dd={
                          submission.resumeSnapshot?.linkedInUrl?.trim() ||
                          "Not provided"
                        }
                      />
                      <AssessmentRow dt="Raw entry (legacy)" dd={submission.contact.raw || "Not provided"} />
                    </dl>
                  </section>

                  {submission.resumeSnapshot &&
                  (submission.resumeSnapshot.linkedInUrl ||
                    submission.resumeSnapshot.resumeFileName ||
                    submission.resumeSnapshot.resumeText) ? (
                    <section className="md:col-span-2 md:border-t md:border-border/40 md:pt-12">
                      <h3 className="mb-6 text-xl font-semibold tracking-tight">Resume &amp; LinkedIn</h3>
                      <dl className="grid grid-cols-[max-content,minmax(0,1fr)] gap-x-4 gap-y-4 text-[0.875rem]">
                        <AssessmentRow
                          dt="LinkedIn URL"
                          dd={submission.resumeSnapshot.linkedInUrl || "Not provided"}
                        />
                        <AssessmentRow
                          dt="Resume file name"
                          dd={submission.resumeSnapshot.resumeFileName || "Not provided"}
                        />
                      </dl>
                      {submission.resumeSnapshot.resumeText ? (
                        <details className="mt-8 rounded-2xl border border-border bg-muted/30 p-4">
                          <summary className="cursor-pointer text-base font-medium">View resume text</summary>
                          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-card p-4 text-sm leading-relaxed">
                            {submission.resumeSnapshot.resumeText}
                          </pre>
                        </details>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">No résumé text was captured for this intake.</p>
                      )}
                    </section>
                  ) : null}
                </CardContent>
              </article>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border border-dashed border-border/65 bg-muted/55 p-14 text-center shadow-none">
            <CardHeader className="p-2">
              <CardTitle className="text-3xl tracking-tight">No submissions yet.</CardTitle>
            </CardHeader>
            <CardContent className="px-12 pb-2 pt-4">
              <CardDescription className="text-[1rem] leading-relaxed">
                Completed chat intakes will appear here after someone finishes the contact step and dear[CC]
                generates an assessment.
              </CardDescription>
            </CardContent>
            <CardFooter className="mt-11 justify-center p-8">
              <Button asChild type="button" className="rounded-2xl cta-glow">
                <Link href="/intake">Open intake</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-muted/70 p-[18px]">
      <strong className="block text-[2rem] tracking-[-0.05em] text-foreground">{value}</strong>
      <span className="block text-[0.9rem] leading-relaxed text-muted-foreground">{title}</span>
    </div>
  );
}

function AssessmentRow({ dt, dd }: { dt: string; dd: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{dt}</dt>
      <dd className="break-words">{dd}</dd>
    </>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
