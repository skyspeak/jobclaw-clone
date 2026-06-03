import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import {
  DREAM_JOB_SKIP_CHIP,
  getFlowStepSequence,
  isQuizPath,
  PROFILE_SKIP_CHIP,
  QUIZ_PATH_INTRO,
} from "@/lib/cc-agent-flow";
import { QUESTIONS } from "@/lib/intake-questions";
import { BRAND_NAME } from "@/lib/brand";

export type TranscriptMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  headline?: string;
};

export function getActiveStepPrompt(
  flowStep: CcAgentStepId,
  profileFiltersIntro?: string,
  quizIndex = 0,
  ccAgent?: CcAgentFlowState,
): { title: string; body?: string } {
  switch (flowStep) {
    case "target-job-url":
      return {
        title: "What is your dream job — paste your dream job URL?",
        body: "We'll parse the listing for skills and gap analysis. No URL yet? Say so below.",
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
    case "linkedin":
      return {
        title: "Add your LinkedIn profile",
        body: "Used for location, network strength, and verification alongside your résumé.",
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
        title: "We have determined next steps for you.",
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
  const messages: TranscriptMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      headline: BRAND_NAME,
      content:
        "Hi — we'll triage your target, vet your profile, and route you into the right track toward proof-of-work and your first offer.",
    },
  ];

  const past = (step: CcAgentStepId) => {
    const idx = stepIndex(sequence, step);
    if (idx < 0) {
      return false;
    }
    return currentIndex > idx;
  };

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
          : targetJobUrl.trim() || "Dream job URL shared",
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

  if (past("profile-upload")) {
    const profileSummary = ccAgent.skippedProfileUpload
      ? PROFILE_SKIP_CHIP
      : [
          linkedInUrl.trim() ? `LinkedIn: ${linkedInUrl.trim()}` : null,
          resumeFileName.trim()
            ? `Résumé: ${resumeFileName.trim()}`
            : resumeText.trim()
              ? "Résumé uploaded"
              : null,
        ]
          .filter(Boolean)
          .join(" · ");

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
