import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getJobFitSubmissionsStoreLabel,
  inputTypeLabel,
  type JobFitSubmission,
} from "@/lib/job-fit-submissions";
import { verdictLabel } from "@/lib/job-fit";

type AdminJobFitSubmissionsProps = {
  submissions: JobFitSubmission[];
};

export function AdminJobFitSubmissions({ submissions }: AdminJobFitSubmissionsProps) {
  const storeLabel = getJobFitSubmissionsStoreLabel();

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 p-8 md:p-10">
        <CardTitle className="text-xl tracking-tight">Job fit submissions</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Every analysis run from the public job-fit page — pasted text, URLs, or library picks — with who
          submitted it when intake contact info is on file.
        </CardDescription>
        <p className="text-sm font-medium text-muted-foreground">
          Storage: <span className="text-card-foreground">{storeLabel}</span>
          {" · "}
          <span className="text-card-foreground">{submissions.length}</span> total
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40">
                  <th className="px-4 py-3.5 font-semibold md:px-8">When</th>
                  <th className="px-4 py-3.5 font-semibold">Who</th>
                  <th className="px-4 py-3.5 font-semibold">Input</th>
                  <th className="px-4 py-3.5 font-semibold">Job</th>
                  <th className="px-4 py-3.5 font-semibold md:px-8">Fit</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <JobFitSubmissionRow key={submission.id} submission={submission} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-sm text-muted-foreground md:px-10">
            No job-fit runs recorded yet. Submissions appear here after someone analyzes a job on the job-fit
            page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function JobFitSubmissionRow({ submission }: { submission: JobFitSubmission }) {
  const submitted = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(submission.createdAt));

  const who =
    submission.submitterName.trim() ||
    submission.submitterEmail.trim() ||
    submission.submitterPhone.trim() ||
    "Anonymous";

  return (
    <tr className="border-b border-border/55 last:border-0 odd:bg-card even:bg-muted/20">
      <td className="whitespace-nowrap px-4 py-4 align-top md:px-8">
        <p className="text-foreground">{submitted}</p>
      </td>
      <td className="max-w-[200px] px-4 py-4 align-top">
        <p className="font-medium text-foreground">{who}</p>
        {submission.submitterEmail ? (
          <p className="mt-1 break-all text-xs text-muted-foreground">{submission.submitterEmail}</p>
        ) : null}
        {submission.submitterPhone ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{submission.submitterPhone}</p>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-top">
        <span className="font-medium text-foreground">{inputTypeLabel(submission.inputType)}</span>
        {submission.listingTitle ? (
          <p className="mt-1 max-w-[140px] text-xs text-muted-foreground">{submission.listingTitle}</p>
        ) : null}
      </td>
      <td className="max-w-[320px] px-4 py-4 align-top">
        {submission.jobUrl ? (
          <a
            className="mb-2 block break-all text-xs font-medium text-foreground underline-offset-4 hover:underline"
            href={submission.jobUrl}
            rel="noreferrer"
            target="_blank"
          >
            {submission.jobUrl}
          </a>
        ) : null}
        {submission.roleTitle ? (
          <p className="font-medium text-foreground">{submission.roleTitle}</p>
        ) : null}
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            View description
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
            {submission.jobDescription}
          </pre>
        </details>
      </td>
      <td className="px-4 py-4 align-top md:px-8">
        {submission.verdict === "ready" ||
        submission.verdict === "stretch" ||
        submission.verdict === "gap" ? (
          <p className="font-medium text-foreground">{verdictLabel(submission.verdict)}</p>
        ) : submission.verdict ? (
          <p className="font-medium text-foreground">{submission.verdict}</p>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {submission.resultHeadline ? (
          <p className="mt-1 text-xs text-muted-foreground">{submission.resultHeadline}</p>
        ) : null}
      </td>
    </tr>
  );
}
