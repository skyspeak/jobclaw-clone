import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import {
  DREAM_JOB_SKIP_CHIP,
  getFlowStepSequence,
  isQuizPath,
  PROFILE_SKIP_CHIP,
  QUIZ_PATH_INTRO,
} from "@/lib/cc-agent-flow";
import { QUESTIONS } from "@/lib/intake-questions";

export type TranscriptMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  headline?: string;
  /** Shown while the user is still on the active step (not yet committed). */
  pending?: boolean;
};

function formatProfileUserMessage(input: {
  skippedProfileUpload: boolean;
  linkedInUrl: string;
  resumeFileName: string;
  resumeText: string;
}): string | null {
  if (input.skippedProfileUpload) {
    return PROFILE_SKIP_CHIP;
  }

  const parts = [
    input.linkedInUrl.trim() ? `LinkedIn: ${input.linkedInUrl.trim()}` : null,
    input.resumeFileName.trim()
      ? `Résumé: ${input.resumeFileName.trim()}`
      : input.resumeText.trim()
        ? "Résumé uploaded"
        : null,
  ].filter(Boolean);

  return parts.length ? parts.join("\n") : null;
}

export function formatConnectUserMessage(input: {
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeFileName: string;
  resumeText: string;
}): string {
  const jobPart = input.targetJobUrl.trim() || "Job listing URL shared";
  const profilePart = formatProfileUserMessage({
    skippedProfileUpload: input.ccAgent.skippedProfileUpload,
    linkedInUrl: input.linkedInUrl,
    resumeFileName: input.resumeFileName,
    resumeText: input.resumeText,
  });

  return [jobPart, profilePart].filter(Boolean).join("\n");
}

export function getLinkedInOpeningPrompt(): { title: string; body: string } {
  return {
    title: "First, what's your LinkedIn profile URL?",
    body: "Hi! I'll compare your profile to a target role and show you exactly where to focus to get hired.\n\nI'll use it to understand your background before we look at a role together.",
  };
}

/** User inputs for the active step — shown on the right before Continue. */
export function buildLiveUserInputs(input: {
  flowStep: CcAgentStepId;
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeFileName: string;
  resumeText: string;
  currentAnswer: string;
  email?: string;
}): TranscriptMessage[] {
  const { flowStep, ccAgent, targetJobUrl, linkedInUrl, resumeFileName, resumeText, currentAnswer, email } =
    input;
  const messages: TranscriptMessage[] = [];
  const pendingUser = (id: string, content: string): TranscriptMessage => ({
    id,
    role: "user",
    content,
    pending: true,
  });

  if (flowStep === "quiz" && currentAnswer.trim()) {
    messages.push(pendingUser("live-quiz-answer", currentAnswer.trim()));
  }

  if (flowStep === "connect") {
    if (targetJobUrl.trim()) {
      messages.push(pendingUser("live-job-url", targetJobUrl.trim()));
    }
    const profile = formatProfileUserMessage({
      skippedProfileUpload: ccAgent.skippedProfileUpload,
      linkedInUrl,
      resumeFileName,
      resumeText,
    });
    if (profile) {
      messages.push(pendingUser("live-profile", profile));
    }
  }

  if (flowStep === "target-job-url") {
    if (ccAgent.knowsTargetJob === false) {
      messages.push(pendingUser("live-no-job", DREAM_JOB_SKIP_CHIP));
    } else if (targetJobUrl.trim()) {
      messages.push(pendingUser("live-job-url", targetJobUrl.trim()));
    }
  }

  if (flowStep === "profile-upload") {
    const profile = formatProfileUserMessage({
      skippedProfileUpload: ccAgent.skippedProfileUpload,
      linkedInUrl,
      resumeFileName,
      resumeText,
    });
    if (profile) {
      messages.push(pendingUser("live-profile", profile));
    }
  }

  if (flowStep === "linkedin") {
    if (ccAgent.skippedProfileUpload) {
      messages.push(pendingUser("live-no-profile", PROFILE_SKIP_CHIP));
    } else if (linkedInUrl.trim()) {
      messages.push(pendingUser("live-linkedin", linkedInUrl.trim()));
    }
  }

  if (flowStep === "unlock-roadmap" && email?.trim()) {
    messages.push(pendingUser("live-unlock-email", email.trim()));
  }

  if (flowStep === "resume") {
    if (resumeFileName.trim()) {
      messages.push(pendingUser("live-resume", `Résumé: ${resumeFileName.trim()}`));
    } else if (resumeText.trim()) {
      messages.push(pendingUser("live-resume", "Résumé uploaded"));
    }
  }

  return messages;
}

export function getActiveStepPrompt(
  flowStep: CcAgentStepId,
  profileFiltersIntro?: string,
  quizIndex = 0,
  ccAgent?: CcAgentFlowState,
): { title: string; body?: string } {
  switch (flowStep) {
    case "connect":
      return {
        title: "Connect your job and your profile",
        body: "Paste the listing you applied to and your LinkedIn URL so we can read the gap between them.",
      };
    case "linkedin":
      return getLinkedInOpeningPrompt();
    case "target-job-url":
      return {
        title: "Now paste a job posting you're going after.",
        body: "LinkedIn, Greenhouse, or company careers links work best—or tell me if you don't have one yet.",
      };
    case "profile-upload":
      return {
        title: "Upload your LinkedIn and your resume",
        body: "Share at least one so we can vet your profile and personalize your brief.",
      };
    case "resume":
      return {
        title: "Upload your résumé",
        body: "Text-based files (.txt, .md, …) so we can build your skill graph.",
      };
    case "quiz": {
      const q = QUESTIONS[quizIndex];
      if (ccAgent && isQuizPath(ccAgent) && quizIndex === 0) {
        return {
          title: QUIZ_PATH_INTRO,
          body: [q.prompt, q.hint].filter(Boolean).join("\n\n"),
        };
      }
      return { title: q.prompt, body: q.hint };
    }
    case "vetting-result":
      return {
        title: "Here's how your profile stacks up.",
        body: "Strengths you already bring and gaps the role needed that didn't show up.",
      };
    case "unlock-roadmap":
      return {
        title: "Your 6-week roadmap is ready — what's your email?",
        body: "Enter it below and we'll unlock a plan built around the gaps we found.",
      };
    case "journey":
      return {
        title: "Your journey to become AI native",
        body: "Pick a six-week project sprint that builds proof-of-work for your target role.",
      };
    case "search-filters":
      return {
        title: "Almost there — any search filters?",
        body:
          profileFiltersIntro ??
          "Optional preferences to narrow roles. Skip anything that doesn't matter.",
      };
    default:
      return { title: "Let's continue" };
  }
}

function stepIndex(sequence: CcAgentStepId[], step: CcAgentStepId): number {
  return sequence.indexOf(step);
}

export function buildTranscript(input: {
  flowStep: CcAgentStepId;
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeFileName: string;
  resumeText: string;
  wizardAnswers: string[];
  quizIndex: number;
}): TranscriptMessage[] {
  const {
    flowStep,
    ccAgent,
    targetJobUrl,
    linkedInUrl,
    resumeFileName,
    resumeText,
    wizardAnswers,
    quizIndex,
  } = input;
  const sequence = getFlowStepSequence(ccAgent);
  const currentIndex = stepIndex(sequence, flowStep);
  const messages: TranscriptMessage[] = [];

  const past = (step: CcAgentStepId) => {
    const idx = stepIndex(sequence, step);
    if (idx < 0) {
      return false;
    }
    return currentIndex > idx;
  };

  if (past("linkedin")) {
    const linkedInPrompt = getLinkedInOpeningPrompt();
    messages.push({
      id: "asst-linkedin",
      role: "assistant",
      headline: linkedInPrompt.title,
      content: linkedInPrompt.body,
    });
    messages.push({
      id: "user-linkedin",
      role: "user",
      content: ccAgent.skippedProfileUpload
        ? PROFILE_SKIP_CHIP
        : linkedInUrl.trim() || "LinkedIn profile shared",
    });
  }

  if (past("target-job-url") && ccAgent.knowsTargetJob !== null) {
    messages.push({
      id: "asst-dream-job",
      role: "assistant",
      content: getActiveStepPrompt("target-job-url").title,
    });
    messages.push({
      id: "user-dream-job",
      role: "user",
      content:
        ccAgent.knowsTargetJob === false
          ? DREAM_JOB_SKIP_CHIP
          : targetJobUrl.trim() || "Job listing URL shared",
    });
  }

  if (isQuizPath(ccAgent)) {
    for (let i = 0; i < 5; i++) {
      const answered = Boolean(wizardAnswers[i]?.trim());
      const quizPast =
        flowStep !== "quiz" || i < quizIndex ? past("quiz") || i < quizIndex : false;

      if (!answered && !quizPast) {
        break;
      }

      if (quizPast && answered) {
        const prompt =
          i === 0 ? `${QUIZ_PATH_INTRO}\n\n${QUESTIONS[i].prompt}` : QUESTIONS[i].prompt;
        messages.push(
          { id: `asst-q-${i}`, role: "assistant", content: prompt },
          { id: `user-q-${i}`, role: "user", content: wizardAnswers[i] },
        );
      }
    }
  }

  if (past("connect")) {
    messages.push({
      id: "asst-connect",
      role: "assistant",
      content: getActiveStepPrompt("connect").title,
    });
    messages.push({
      id: "user-connect",
      role: "user",
      content: formatConnectUserMessage({
        ccAgent,
        targetJobUrl,
        linkedInUrl,
        resumeFileName,
        resumeText,
      }),
    });
  }

  if (past("profile-upload")) {
    const profileSummary = formatProfileUserMessage({
      skippedProfileUpload: ccAgent.skippedProfileUpload,
      linkedInUrl,
      resumeFileName,
      resumeText,
    });

    if (profileSummary) {
      messages.push({
        id: "asst-profile",
        role: "assistant",
        content: getActiveStepPrompt("profile-upload").title,
      });
      messages.push({
        id: "user-profile",
        role: "user",
        content: profileSummary,
      });
    }
  }

  if (past("vetting-result") && ccAgent.vettingResult) {
    messages.push({
      id: "asst-vetting",
      role: "assistant",
      content: getActiveStepPrompt("vetting-result").title,
    });
  }

  return messages;
}
