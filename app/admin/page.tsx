import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE_NAME, isValidAdminPassword } from "@/lib/admin";
import { intakeQuestions } from "@/lib/jobclaw";
import { getSubmissionStoreLabel, listSubmissions } from "@/lib/submissions";

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

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const queryPassword = getFirstParam(params.password) ?? getFirstParam(params.token);
  const cookieStore = await cookies();
  const cookiePassword = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidAdminPassword(queryPassword) && !isValidAdminPassword(cookiePassword)) {
    return (
      <main className="page">
        <nav className="home-nav" aria-label="Main links">
          <Link href="/">DearCC presents JobClaw</Link>
        </nav>
        <section className="admin-shell">
          <div className="card empty-admin admin-login">
            <p className="eyebrow">Administrator dashboard</p>
            <h1>Admin access required.</h1>
            <p className="muted">
              Enter the admin password to view people, assessments, and contact
              information at this URL.
            </p>
            <form action={signInAdmin} className="admin-login-form">
              <label htmlFor="admin-password">Password</label>
              <input
                autoComplete="current-password"
                id="admin-password"
                name="password"
                placeholder="Enter admin password"
                type="password"
              />
              {getFirstParam(params.error) ? (
                <p className="form-error">That password did not match.</p>
              ) : null}
              <button className="button" type="submit">
                Open admin page
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const submissions = await listSubmissions();
  const submissionStoreLabel = getSubmissionStoreLabel();
  const contactedCount = submissions.filter(
    (submission) =>
      submission.contact.name || submission.contact.email || submission.contact.phone,
  ).length;

  return (
    <main className="page">
      <nav className="home-nav" aria-label="Main links">
        <Link href="/">DearCC presents JobClaw</Link>
      </nav>

      <section className="admin-shell">
        <div className="admin-header card">
          <p className="eyebrow">Administrator dashboard</p>
          <h1>People, assessments, and contact info.</h1>
          <p className="lead">
            Review completed chat intakes, follow-up details, inferred roles, and
            profile assessments in one place.
          </p>
          <p className="muted">Storage: {submissionStoreLabel}</p>

          <div className="admin-metrics">
            <div>
              <strong>{submissions.length}</strong>
              <span>Total intakes</span>
            </div>
            <div>
              <strong>{contactedCount}</strong>
              <span>With contact info</span>
            </div>
            <div>
              <strong>
                {
                  submissions.filter((submission) => submission.profileDraft?.archetype?.name)
                    .length
                }
              </strong>
              <span>With archetype</span>
            </div>
          </div>
        </div>

        {submissions.length > 0 ? (
          <div className="admin-list">
            {submissions.map((submission) => (
              <article className="card admin-submission" key={submission.id}>
                <header className="admin-submission-header">
                  <div>
                    <p className="eyebrow">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(submission.createdAt))}
                    </p>
                    <h2>{submission.contact.name || "Unnamed person"}</h2>
                    <p className="muted">{submission.result.summary}</p>
                  </div>
                  <div className="admin-contact-card">
                    <span>{submission.contact.email || "No email"}</span>
                    <span>{submission.contact.phone || "No phone"}</span>
                  </div>
                </header>

                <div className="admin-grid">
                  <section>
                    <h3>Assessment</h3>
                    <dl className="admin-details">
                      <dt>Archetype</dt>
                      <dd>{submission.profileDraft?.archetype?.name || "Not generated"}</dd>
                      <dt>Ideal job</dt>
                      <dd>
                        {submission.profileDraft?.idealJob?.title ||
                          submission.result.searchRequest?.jobTitle ||
                          "Not generated"}
                      </dd>
                      <dt>Headline</dt>
                      <dd>{submission.profileDraft?.linkedInProfile?.headline || "Not generated"}</dd>
                      <dt>Location</dt>
                      <dd>{submission.defaults.location || "Any"}</dd>
                      <dt>Work mode</dt>
                      <dd>{submission.defaults.workMode}</dd>
                    </dl>
                  </section>

                  <section>
                    <h3>Contact</h3>
                    <dl className="admin-details">
                      <dt>Name</dt>
                      <dd>{submission.contact.name || "Not provided"}</dd>
                      <dt>Email</dt>
                      <dd>{submission.contact.email || "Not provided"}</dd>
                      <dt>Phone</dt>
                      <dd>{submission.contact.phone || "Not provided"}</dd>
                      <dt>Raw entry</dt>
                      <dd>{submission.contact.raw || "Not provided"}</dd>
                    </dl>
                  </section>
                </div>

                <details className="admin-answers">
                  <summary>View chat answers</summary>
                  <dl>
                    {intakeQuestions.map((question) => (
                      <div key={question.id}>
                        <dt>{question.label}</dt>
                        <dd>{submission.answers[question.id]}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="card empty-admin">
            <h2>No submissions yet.</h2>
            <p className="muted">
              Completed chat intakes will appear here after someone finishes the
              contact step and JobClaw generates an assessment.
            </p>
            <Link className="button" href="/">
              Open intake
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
