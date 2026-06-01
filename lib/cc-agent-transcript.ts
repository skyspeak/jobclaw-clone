import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { CC_AGENT_ROLE_LABELS, getFlowStepSequence } from "@/lib/cc-agent-flow";
import { QUESTIONS } from "@/lib/intake-questions";
import { BRAND_NAME } from "@/lib/brand";

export type TranscriptMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export function getActiveStepPrompt(
  flowStep: CcAgentStepId,
  profileFiltersIntro?: string,
): { title: string; body?: string } {
  switch (flowStep) {
    case "hook":
      return {
        title: "Do you know what job you want?",
        body: "If yes, you'll paste a target job URL next. If not, we'll use your résumé and a short quiz to suggest roles.",
      };
    case "target-job-url":
      return {
        title: "Paste your target job posting",
        body: "We'll parse the listing for required skills and gap analysis.",
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
    case "quiz":
      return { title: "", body: "" };
    case "role-suggestions":
      return {
        title: "Which role should we optimize for?",
        body: "MVP vetted roles: Sales, Marketing, Forward Deployed Engineer, Software Engineer.",
      };
    case "vetting-result":
      return {
        title: "Here's your vetting readout",
        body: "Both paths continue. Vetted status unlocks mentorship after your team proof-of-work sprint.",
      };
    case "nurture-track":
      return {
        title: "Your nurture track",
        body: "This is how dear[CC] will coach you toward a portfolio piece recruiters can trust.",
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
  resumeFileName: string;
  wizardAnswers: string[];
  quizIndex: number;
}): TranscriptMessage[] {
  const { flowStep, ccAgent, targetJobUrl, resumeFileName, wizardAnswers } = input;
  const sequence = getFlowStepSequence(ccAgent.knowsTargetJob);
  const currentIndex = stepIndex(sequence, flowStep);
  const messages: TranscriptMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      content: `Hi — I'm ${BRAND_NAME}. We'll triage your target, vet your profile, and route you into the right track toward proof-of-work and your first offer.`,
    },
  ];

  const past = (step: CcAgentStepId) => currentIndex > stepIndex(sequence, step);

  if (past("hook") && ccAgent.knowsTargetJob !== null) {
    messages.push({
      id: "user-hook",
      role: "user",
      content: ccAgent.knowsTargetJob
        ? "Yes — I have a target job in mind."
        : "Not yet — help me figure it out.",
    });
  }

  if (ccAgent.knowsTargetJob === true && past("target-job-url") && targetJobUrl.trim()) {
    messages.push(
      {
        id: "asst-target",
        role: "assistant",
        content: getActiveStepPrompt("target-job-url").title,
      },
      { id: "user-target", role: "user", content: targetJobUrl.trim() },
    );
  }

  if (past("resume") && (resumeFileName || ccAgent.knowsTargetJob === false)) {
    messages.push(
      {
        id: "asst-resume",
        role: "assistant",
        content: getActiveStepPrompt("resume").title,
      },
      {
        id: "user-resume",
        role: "user",
        content: resumeFileName ? `Uploaded résumé: ${resumeFileName}` : "Résumé uploaded.",
      },
    );
  }

  if (ccAgent.knowsTargetJob === false) {
    for (let i = 0; i < 5; i++) {
      const answered = Boolean(wizardAnswers[i]?.trim());
      const quizPast =
        flowStep !== "quiz" || i < input.quizIndex ? past("quiz") || i < input.quizIndex : false;

      if (!answered && !quizPast) {
        break;
      }

      if (quizPast && answered) {
        messages.push(
          { id: `asst-q-${i}`, role: "assistant", content: QUESTIONS[i].prompt },
          { id: `user-q-${i}`, role: "user", content: wizardAnswers[i] },
        );
      }
    }
  }

  if (past("role-suggestions") && ccAgent.selectedRoleId) {
    const label =
      CC_AGENT_ROLE_LABELS[ccAgent.selectedRoleId as keyof typeof CC_AGENT_ROLE_LABELS] ??
      ccAgent.selectedRoleId;
    messages.push(
      {
        id: "asst-roles",
        role: "assistant",
        content: getActiveStepPrompt("role-suggestions").title,
      },
      { id: "user-role", role: "user", content: label },
    );
  }

  if (past("linkedin")) {
    messages.push({
      id: "asst-linkedin",
      role: "assistant",
      content: getActiveStepPrompt("linkedin").title,
    });
    messages.push({
      id: "user-linkedin",
      role: "user",
      content: "Shared LinkedIn / profile details.",
    });
  }

  if (past("vetting-result") && ccAgent.vettingResult) {
    messages.push({
      id: "asst-vetting",
      role: "assistant",
      content: `${getActiveStepPrompt("vetting-result").title}\n\n${ccAgent.vettingResult.summary}`,
    });
  }

  if (past("nurture-track") && ccAgent.vettingResult) {
    messages.push({
      id: "asst-nurture",
      role: "assistant",
      content: getActiveStepPrompt("nurture-track").title,
    });
  }

  return messages;
}
