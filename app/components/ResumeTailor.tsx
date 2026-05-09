"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { defaultSearchDefaults, JobClawResponse, SearchDefaults, SearchRequest } from "@/lib/jobclaw";
import type { GeneratedResume, StudentResumeIntake } from "@/lib/resume";

const intakeStorageKey = "jobclaw.turn-taking-session.v1";

type StoredIntakeSession = {
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  defaults?: Partial<SearchDefaults>;
  result?: JobClawResponse | null;
  profileDraft?: {
    idealJob?: {
      title?: string;
      adjacentTitles?: string[];
    };
    linkedInProfile?: {
      skills?: string[];
    };
  } | null;
  generatedResume?: GeneratedResume | null;
};

type JobOption = {
  id: string;
  title: string;
  keywords: string[];
  description: string;
};

type TailoredResumeResult = {
  jobId: string;
  jobTitle: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  tailoredResume: string;
  coverNote: string;
};

type TailoredResumeResponse = {
  email: string;
  results: TailoredResumeResult[];
  error?: string;
};

const emptyResumeIntake: StudentResumeIntake = {
  name: "",
  email: "",
  phone: "",
  location: "",
  degree: "",
  coolProjects: "",
  clubs: "",
  shippedProjects: "",
  internships: "",
  fullTimeRoles: "",
};

export function ResumeTailor() {
  const [initialState] = useState(readInitialTailorState);
  const [session, setSession] = useState<StoredIntakeSession | null>(initialState.session);
  const [resumeText, setResumeText] = useState(initialState.resumeText);
  const [email, setEmail] = useState(initialState.email);
  const [resumeBuilderIntake, setResumeBuilderIntake] = useState<StudentResumeIntake>(
    initialState.resumeBuilderIntake,
  );
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(
    initialState.generatedResume,
  );
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(initialState.selectedJobIds);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isGeneratingStarterResume, setIsGeneratingStarterResume] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TailoredResumeResult[]>([]);

  const jobOptions = useMemo(() => initialState.jobOptions, [initialState.jobOptions]);
  const hasCompletedMatch = Boolean(session?.result?.searchRequest && jobOptions.length > 0);
  const selectedJobs = jobOptions.filter((job) => selectedJobIds.includes(job.id));
  const canSubmit =
    hasCompletedMatch &&
    selectedJobs.length >= 1 &&
    selectedJobs.length <= 3 &&
    isLikelyEmail(email) &&
    resumeText.trim().length >= 200 &&
    !isGeneratingStarterResume &&
    !isTailoring;

  async function readResumeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsReadingFile(true);
    setError("");

    try {
      const text = await file.text();

      if (!text.trim()) {
        throw new Error("That file did not contain readable text. Try a .txt file or paste your resume text.");
      }

      setResumeText(text.trim());
      setGeneratedResume(null);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to read that resume file.";
      setError(message);
    } finally {
      setIsReadingFile(false);
    }
  }

  function toggleSelectedJob(jobId: string) {
    setError("");
    setSelectedJobIds((currentIds) => {
      if (currentIds.includes(jobId)) {
        return currentIds.filter((id) => id !== jobId);
      }

      if (currentIds.length >= 3) {
        return currentIds;
      }

      return [...currentIds, jobId];
    });
  }

  function updateResumeBuilderField(field: keyof StudentResumeIntake, value: string) {
    setError("");
    setResumeBuilderIntake((currentIntake) => ({
      ...currentIntake,
      [field]: value,
    }));

    if (field === "email") {
      setEmail(value);
    }
  }

  async function generateStarterResume() {
    const intake: StudentResumeIntake = {
      ...resumeBuilderIntake,
      email: resumeBuilderIntake.email || email,
    };
    const hasEvidence = [
      intake.degree,
      intake.coolProjects,
      intake.clubs,
      intake.shippedProjects,
      intake.internships,
      intake.fullTimeRoles,
    ].some((value) => value.trim().length > 0);

    if (!hasEvidence) {
      setError("Add at least one project, club, degree, internship, or role before generating.");
      return;
    }

    setIsGeneratingStarterResume(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intake,
          surveySummary: session?.result?.summary ?? "",
          profileDraft: session?.profileDraft ?? null,
        }),
      });
      const payload = (await response.json()) as GeneratedResume & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate a starter resume.");
      }

      setGeneratedResume(payload);
      setResumeText(payload.resumeText);
      persistGeneratedResume(payload);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to generate a starter resume.";
      setError(message);
    } finally {
      setIsGeneratingStarterResume(false);
    }
  }

  async function tailorResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedJobs.length < 1) {
      setError("Pick at least 1 matched job.");
      return;
    }

    if (selectedJobs.length > 3) {
      setError("Pick at most 3 matched jobs.");
      return;
    }

    if (!isLikelyEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (resumeText.trim().length < 200) {
      setError("Add at least 200 characters of resume text so the tailoring has enough evidence.");
      return;
    }

    setIsTailoring(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          resumeText,
          surveySummary: session?.result?.summary ?? "",
          selectedJobs,
        }),
      });
      const payload = (await response.json()) as TailoredResumeResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to tailor the resume.");
      }

      setResults(payload.results);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to tailor the resume.";
      setError(message);
    } finally {
      setIsTailoring(false);
    }
  }

  function persistGeneratedResume(nextGeneratedResume: GeneratedResume) {
    const nextSession: StoredIntakeSession = {
      ...(session ?? {}),
      contact: {
        ...(session?.contact ?? {}),
        name: resumeBuilderIntake.name || session?.contact?.name,
        email: email || resumeBuilderIntake.email || session?.contact?.email,
        phone: resumeBuilderIntake.phone || session?.contact?.phone,
      },
      generatedResume: nextGeneratedResume,
    };

    setSession(nextSession);
    window.localStorage.setItem(intakeStorageKey, JSON.stringify(nextSession));
  }

  if (!hasCompletedMatch) {
    return (
      <section className="card tailor-card">
        <p className="eyebrow">Resume tailoring</p>
        <h1>Finish the survey first.</h1>
        <p className="lead">
          JobClaw needs a completed survey match before it can tailor a resume to a target job.
        </p>
        <Link className="button" href="/">
          Go to survey
        </Link>
      </section>
    );
  }

  return (
    <section className="card tailor-card" aria-labelledby="tailor-title">
      <div className="tailor-header">
        <div>
          <p className="eyebrow">Resume tailoring</p>
          <h1 id="tailor-title">Tailor your resume to matched jobs.</h1>
          <p className="lead">
            Upload or paste your resume, confirm your email, then pick 1 to 3 matched jobs.
            JobClaw will identify required skills and rewrite your resume for each target.
          </p>
        </div>
        <span className="pill">{selectedJobs.length} / 3 selected</span>
      </div>

      <form className="tailor-form" onSubmit={tailorResume}>
        <div className="tailor-grid">
          <section className="tailor-panel">
            <h2>Your resume</h2>
            <label>
              Email for this resume draft
              <input
                autoComplete="email"
                inputMode="email"
                placeholder="student@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Upload resume text
              <input
                accept=".txt,.md,.rtf,.csv,.json"
                type="file"
                onChange={readResumeFile}
              />
            </label>
            <p className="muted">
              Text-based uploads work best. If your resume is a PDF or DOCX, paste the resume
              text below.
            </p>
            <label>
              Resume text
              <textarea
                className="resume-textarea"
                placeholder="Paste your resume here..."
                value={resumeText}
                onChange={(event) => {
                  setResumeText(event.target.value);
                  setGeneratedResume(null);
                }}
              />
            </label>
            {isReadingFile ? <p className="muted">Reading resume file...</p> : null}
            <div className="starter-resume-card">
              <div>
                <span className="pill">No resume yet?</span>
                <p className="muted">
                  Answer a few student-focused questions and JobClaw will draft a truthful starter
                  resume you can review and tailor.
                </p>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowResumeBuilder((isVisible) => !isVisible)}
              >
                {showResumeBuilder ? "Hide starter builder" : "Build a starter resume"}
              </button>
            </div>
            {showResumeBuilder ? (
              <StarterResumeBuilder
                generatedResume={generatedResume}
                intake={resumeBuilderIntake}
                isGenerating={isGeneratingStarterResume}
                onGenerate={generateStarterResume}
                onUpdate={updateResumeBuilderField}
              />
            ) : null}
          </section>

          <section className="tailor-panel">
            <h2>Pick matched jobs</h2>
            <p className="muted">Choose at least 1 and at most 3 jobs from your completed survey match.</p>
            <div className="job-option-list">
              {jobOptions.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                const isDisabled = !isSelected && selectedJobIds.length >= 3;

                return (
                  <label
                    className={`job-option${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}`}
                    key={job.id}
                  >
                    <input
                      checked={isSelected}
                      disabled={isDisabled}
                      type="checkbox"
                      onChange={() => toggleSelectedJob(job.id)}
                    />
                    <span>
                      <strong>{job.title}</strong>
                      <small>{job.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {error ? <p className="warning">{error}</p> : null}

        <div className="actions">
          <button className="button" disabled={!canSubmit}>
            {isTailoring ? "Tailoring..." : "Tailor resume"}
          </button>
          <Link className="button secondary" href="/">
            Back to survey
          </Link>
        </div>
      </form>

      {results.length > 0 ? <TailoredResults results={results} /> : null}
    </section>
  );
}

function readInitialTailorState() {
  const session = readStoredIntakeSession();
  const jobOptions = buildJobOptions(session);
  const generatedResume = session?.generatedResume ?? null;

  return {
    session,
    jobOptions,
    email: session?.contact?.email ?? "",
    generatedResume,
    resumeText: generatedResume?.resumeText ?? "",
    resumeBuilderIntake: {
      ...emptyResumeIntake,
      name: session?.contact?.name ?? "",
      email: session?.contact?.email ?? "",
      phone: session?.contact?.phone ?? "",
    },
    selectedJobIds: jobOptions[0]?.id ? [jobOptions[0].id] : [],
  };
}

function readStoredIntakeSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(intakeStorageKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as StoredIntakeSession;
  } catch {
    return null;
  }
}

function StarterResumeBuilder({
  generatedResume,
  intake,
  isGenerating,
  onGenerate,
  onUpdate,
}: {
  generatedResume: GeneratedResume | null;
  intake: StudentResumeIntake;
  isGenerating: boolean;
  onGenerate: () => void;
  onUpdate: (field: keyof StudentResumeIntake, value: string) => void;
}) {
  return (
    <section className="starter-builder" aria-label="Starter resume builder">
      <div className="starter-builder-grid">
        <label>
          Name
          <input
            autoComplete="name"
            placeholder="Jane Doe"
            value={intake.name}
            onChange={(event) => onUpdate("name", event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            inputMode="email"
            placeholder="student@example.com"
            type="email"
            value={intake.email}
            onChange={(event) => onUpdate("email", event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={intake.phone}
            onChange={(event) => onUpdate("phone", event.target.value)}
          />
        </label>
        <label>
          Location
          <input
            autoComplete="address-level2"
            placeholder="Oakland, CA"
            value={intake.location}
            onChange={(event) => onUpdate("location", event.target.value)}
          />
        </label>
      </div>

      <label>
        Degree, school, and graduation timing
        <textarea
          placeholder="B.S. Computer Science, State University, expected May 2027..."
          value={intake.degree}
          onChange={(event) => onUpdate("degree", event.target.value)}
        />
      </label>
      <label>
        Cool projects you have worked on
        <textarea
          placeholder="Class projects, hackathons, research, creative work, apps, events..."
          value={intake.coolProjects}
          onChange={(event) => onUpdate("coolProjects", event.target.value)}
        />
      </label>
      <label>
        Clubs, leadership, volunteer work, or campus groups
        <textarea
          placeholder="Clubs you joined, roles you held, events you helped run..."
          value={intake.clubs}
          onChange={(event) => onUpdate("clubs", event.target.value)}
        />
      </label>
      <label>
        Projects, products, events, or content you shipped
        <textarea
          placeholder="Anything people used, attended, watched, read, installed, or reviewed..."
          value={intake.shippedProjects}
          onChange={(event) => onUpdate("shippedProjects", event.target.value)}
        />
      </label>
      <label>
        Internships
        <textarea
          placeholder="Company or organization, role, dates if known, what you did..."
          value={intake.internships}
          onChange={(event) => onUpdate("internships", event.target.value)}
        />
      </label>
      <label>
        Full-time roles or other jobs
        <textarea
          placeholder="Full-time, part-time, campus jobs, family business, freelance work..."
          value={intake.fullTimeRoles}
          onChange={(event) => onUpdate("fullTimeRoles", event.target.value)}
        />
      </label>

      <div className="actions">
        <button className="button" disabled={isGenerating} type="button" onClick={onGenerate}>
          {isGenerating ? "Building starter resume..." : "Generate starter resume"}
        </button>
      </div>

      {generatedResume ? (
        <div className="starter-review" aria-live="polite">
          <span className="pill">Starter resume ready</span>
          <p className="muted">
            The draft is in the resume text box above. Review it for accuracy before tailoring or
            sending.
          </p>
          {generatedResume.sectionsUsed.length > 0 ? (
            <p className="muted">Sections used: {generatedResume.sectionsUsed.join(", ")}</p>
          ) : null}
          {generatedResume.needsReview.length > 0 ? (
            <ul>
              {generatedResume.needsReview.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TailoredResults({ results }: { results: TailoredResumeResult[] }) {
  return (
    <div className="tailored-results" aria-live="polite">
      <div>
        <span className="pill">Tailored drafts ready</span>
        <p className="muted">
          Review for accuracy before sending. The draft should never add credentials or dates that
          are not true.
        </p>
      </div>

      {results.map((result) => (
        <article className="tailored-result" key={result.jobId}>
          <h2>{result.jobTitle}</h2>
          <div className="tailor-grid compact">
            <SkillList title="Required skills" skills={result.requiredSkills} />
            <SkillList title="Matched skills" skills={result.matchedSkills} />
            <SkillList title="Skills to build or clarify" skills={result.missingSkills} />
          </div>

          <section className="linkedin-card">
            <h3>Tailored resume</h3>
            <pre>{result.tailoredResume}</pre>
          </section>

          <section className="linkedin-card">
            <h3>Application note</h3>
            <p>{result.coverNote}</p>
          </section>
        </article>
      ))}
    </div>
  );
}

function SkillList({ title, skills }: { title: string; skills: string[] }) {
  return (
    <section className="skill-card">
      <h3>{title}</h3>
      <div className="tag-list">
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </section>
  );
}

function buildJobOptions(session: StoredIntakeSession | null): JobOption[] {
  const searchRequest = session?.result?.searchRequest;

  if (!searchRequest) {
    return [];
  }

  const defaults = { ...defaultSearchDefaults, ...session?.defaults };
  const titles = [
    searchRequest.jobTitle,
    session?.profileDraft?.idealJob?.title,
    ...(session?.profileDraft?.idealJob?.adjacentTitles ?? []),
  ].filter(isNonEmptyString);
  const uniqueTitles = Array.from(new Set(titles)).slice(0, Math.max(searchRequest.maxResults, 3));

  return uniqueTitles.slice(0, 6).map((title, index) => ({
    id: `matched-job-${index}`,
    title,
    keywords: mergeKeywords(searchRequest, session),
    description: describeJobOption(searchRequest, defaults),
  }));
}

function mergeKeywords(searchRequest: SearchRequest, session: StoredIntakeSession | null) {
  return Array.from(
    new Set([
      ...searchRequest.keywords,
      ...(session?.profileDraft?.linkedInProfile?.skills ?? []),
    ]),
  ).slice(0, 12);
}

function describeJobOption(searchRequest: SearchRequest, defaults: SearchDefaults) {
  const location = searchRequest.location || defaults.location || "student's preferred location";
  const mode = searchRequest.workMode !== "Any" ? `${searchRequest.workMode.toLowerCase()} ` : "";
  const seniority =
    searchRequest.seniority !== "Any" ? `${searchRequest.seniority.toLowerCase()} ` : "";

  return `${seniority}${mode}match near ${location}, emphasizing ${searchRequest.keywords.slice(0, 3).join(", ") || "transferable strengths"}.`;
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value?.trim());
}
