import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { getFlowStepSequence, getNextFlowStep, getPrevFlowStep } from "@/lib/cc-agent-flow";
import { hasMinimumProfileEvidence, hasResumeOrLinkedInInput } from "@/lib/intake-session";
import { questionSchema } from "@/lib/intake-questions";

export function isValidJobUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function canProceedFromStep(
  flowStep: CcAgentStepId,
  input: {
    ccAgent: CcAgentFlowState;
    targetJobUrl: string;
    linkedInUrl: string;
    resumeText: string;
    resumeFileName: string;
    currentAnswer: string;
    wizardAnswers: string[];
  },
): { ok: boolean; message?: string } {
  const { ccAgent, targetJobUrl, linkedInUrl, resumeText, resumeFileName, currentAnswer, wizardAnswers } =
    input;

  switch (flowStep) {
    case "hook":
      if (ccAgent.knowsTargetJob === null) {
        return { ok: false, message: "Tell us whether you have a target job in mind." };
      }
      if (!ccAgent.usWorkEligible) {
        return { ok: false, message: "CC Agent MVP requires US work eligibility." };
      }
      return { ok: true };

    case "target-job-url":
      if (!isValidJobUrl(targetJobUrl)) {
        return { ok: false, message: "Paste a valid job posting URL." };
      }
      return { ok: true };

    case "resume":
      if (!resumeText.trim() && !resumeFileName.trim()) {
        return { ok: false, message: "Upload a text-based résumé to continue." };
      }
      return { ok: true };

    case "linkedin":
      if (!hasMinimumProfileEvidence(linkedInUrl, resumeText)) {
        return {
          ok: false,
          message: "Add your LinkedIn profile URL or ensure your résumé is uploaded.",
        };
      }
      return { ok: true };

    case "quiz": {
      const validated = questionSchema.safeParse({ answer: currentAnswer });
      if (!validated.success) {
        return { ok: false, message: validated.error.issues[0]?.message ?? "Please share a bit more." };
      }
      return { ok: true };
    }

    case "role-suggestions":
      if (!ccAgent.selectedRoleId.trim()) {
        return { ok: false, message: "Select a target role to continue." };
      }
      return { ok: true };

    case "vetting-result":
    case "nurture-track":
      return { ok: true };

    case "search-filters":
      if (!hasResumeOrLinkedInInput(linkedInUrl, resumeText, resumeFileName)) {
        return { ok: false, message: "Profile evidence is required before generating your brief." };
      }
      return { ok: true };

    default:
      return { ok: true };
  }
}

export function advanceCcAgentState(
  ccAgent: CcAgentFlowState,
  wizardAnswers: string[],
  currentAnswer: string,
): { next: CcAgentFlowState; nextCurrentAnswer: string; nextWizardAnswers: string[] } {
  let nextAnswers = wizardAnswers;

  if (ccAgent.flowStep === "quiz" && ccAgent.knowsTargetJob === false) {
    nextAnswers = [...wizardAnswers];
    nextAnswers[ccAgent.quizIndex] = currentAnswer;

    if (ccAgent.quizIndex < 4) {
      return {
        next: { ...ccAgent, quizIndex: ccAgent.quizIndex + 1 },
        nextCurrentAnswer: wizardAnswers[ccAgent.quizIndex + 1] ?? "",
        nextWizardAnswers: nextAnswers,
      };
    }
  }

  const nextStep = getNextFlowStep(
    ccAgent.flowStep === "quiz" && ccAgent.knowsTargetJob === false && ccAgent.quizIndex >= 4
      ? { ...ccAgent, quizIndex: 4 }
      : ccAgent,
  );

  if (!nextStep) {
    return { next: ccAgent, nextCurrentAnswer: currentAnswer, nextWizardAnswers: nextAnswers };
  }

  return {
    next: {
      ...ccAgent,
      flowStep: nextStep,
      quizIndex: nextStep === "quiz" ? 0 : ccAgent.quizIndex,
    },
    nextCurrentAnswer:
      nextStep === "quiz" ? (wizardAnswers[0] ?? "") : currentAnswer,
    nextWizardAnswers: nextAnswers,
  };
}

export function retreatCcAgentState(
  ccAgent: CcAgentFlowState,
  wizardAnswers: string[],
  currentAnswer: string,
): { next: CcAgentFlowState; nextCurrentAnswer: string } {
  if (ccAgent.flowStep === "quiz" && ccAgent.knowsTargetJob === false && ccAgent.quizIndex > 0) {
    const prevIndex = ccAgent.quizIndex - 1;
    return {
      next: { ...ccAgent, quizIndex: prevIndex },
      nextCurrentAnswer: wizardAnswers[prevIndex] ?? "",
    };
  }

  const prevStep = getPrevFlowStep(ccAgent);
  if (!prevStep) {
    return { next: ccAgent, nextCurrentAnswer: currentAnswer };
  }

  const sequence = getFlowStepSequence(ccAgent.knowsTargetJob);
  const wasQuiz = ccAgent.flowStep === "quiz";

  return {
    next: {
      ...ccAgent,
      flowStep: prevStep,
      quizIndex: prevStep === "quiz" && wasQuiz ? 4 : prevStep === "quiz" ? 0 : ccAgent.quizIndex,
    },
    nextCurrentAnswer:
      prevStep === "quiz"
        ? (wizardAnswers[prevStep === "quiz" && wasQuiz ? 4 : 0] ?? "")
        : prevStep === "hook"
          ? ""
          : currentAnswer,
  };
}

export function setKnowsTargetJob(ccAgent: CcAgentFlowState, knows: boolean): CcAgentFlowState {
  const sequence = getFlowStepSequence(knows);
  const nextStep = sequence[1] ?? "hook";

  return {
    ...ccAgent,
    knowsTargetJob: knows,
    flowStep: nextStep,
    quizIndex: 0,
  };
}
