import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import {
  getNextFlowStep,
  getPrevFlowStep,
  isQuizPath,
  resolveKnowsTargetJob,
} from "@/lib/cc-agent-flow";
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
  const { ccAgent, targetJobUrl, linkedInUrl, resumeText, resumeFileName, currentAnswer } = input;

  switch (flowStep) {
    case "connect":
      if (!isValidJobUrl(targetJobUrl)) {
        return {
          ok: false,
          message: "Paste a job listing URL, or use the link below if you don't have one.",
        };
      }
      if (ccAgent.skippedProfileUpload) {
        return { ok: true };
      }
      if (!hasMinimumProfileEvidence(linkedInUrl, resumeText)) {
        return {
          ok: false,
          message: "Add your LinkedIn profile URL or upload a résumé to continue.",
        };
      }
      return { ok: true };

    case "profile-upload":
      if (ccAgent.skippedProfileUpload) {
        return { ok: true };
      }
      if (!hasMinimumProfileEvidence(linkedInUrl, resumeText)) {
        return {
          ok: false,
          message: "Add your LinkedIn URL or upload a résumé—or choose the option if you don't have either.",
        };
      }
      return { ok: true };

    case "target-job-url":
      if (ccAgent.knowsTargetJob === false) {
        return { ok: true };
      }
      if (!isValidJobUrl(targetJobUrl)) {
        return {
          ok: false,
          message: "Paste a job listing URL, or use the link below if you don't have one.",
        };
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

    case "vetting-result":
      return { ok: true };

    case "journey":
      return { ok: true };

    case "search-filters":
      if (
        !ccAgent.skippedProfileUpload &&
        !hasResumeOrLinkedInInput(linkedInUrl, resumeText, resumeFileName)
      ) {
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

  if (ccAgent.flowStep === "quiz" && isQuizPath(ccAgent)) {
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
    ccAgent.flowStep === "quiz" && isQuizPath(ccAgent) && ccAgent.quizIndex >= 4
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
    nextCurrentAnswer: nextStep === "quiz" ? (wizardAnswers[0] ?? "") : currentAnswer,
    nextWizardAnswers: nextAnswers,
  };
}

function withResolvedKnowsTargetJob(ccAgent: CcAgentFlowState): CcAgentFlowState {
  const resolved = resolveKnowsTargetJob(ccAgent);
  if (resolved === null || resolved === ccAgent.knowsTargetJob) {
    return ccAgent;
  }

  return { ...ccAgent, knowsTargetJob: resolved };
}

export function advanceFromProfileUpload(
  ccAgent: CcAgentFlowState,
): { next: CcAgentFlowState; nextCurrentAnswer: string } {
  const resolved = withResolvedKnowsTargetJob(ccAgent);
  const nextStep = getNextFlowStep(resolved);
  if (!nextStep) {
    return { next: resolved, nextCurrentAnswer: "" };
  }

  return {
    next: { ...resolved, flowStep: nextStep },
    nextCurrentAnswer: "",
  };
}

export function advanceFromDreamJob(
  ccAgent: CcAgentFlowState,
  targetJobUrl: string,
  wizardAnswers: string[],
): { next: CcAgentFlowState; nextCurrentAnswer: string } {
  const knowsTargetJob = ccAgent.knowsTargetJob === false ? false : true;
  const withKnows = { ...ccAgent, knowsTargetJob };
  const nextStep = getNextFlowStep({ ...withKnows, flowStep: "target-job-url" });

  if (!nextStep) {
    return { next: withKnows, nextCurrentAnswer: "" };
  }

  return {
    next: {
      ...withKnows,
      flowStep: nextStep,
      quizIndex: nextStep === "quiz" ? 0 : withKnows.quizIndex,
    },
    nextCurrentAnswer: nextStep === "quiz" ? (wizardAnswers[0] ?? "") : "",
  };
}

export function retreatCcAgentState(
  ccAgent: CcAgentFlowState,
  wizardAnswers: string[],
  currentAnswer: string,
): { next: CcAgentFlowState; nextCurrentAnswer: string } {
  if (ccAgent.flowStep === "quiz" && isQuizPath(ccAgent) && ccAgent.quizIndex > 0) {
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

  const wasQuiz = ccAgent.flowStep === "quiz";

  return {
    next: {
      ...ccAgent,
      flowStep: prevStep,
      quizIndex: prevStep === "quiz" && wasQuiz ? 4 : prevStep === "quiz" ? 0 : ccAgent.quizIndex,
      skippedProfileUpload:
        prevStep === "profile-upload" ? false : ccAgent.skippedProfileUpload,
      knowsTargetJob:
        prevStep === "target-job-url" || prevStep === "connect" ? null : ccAgent.knowsTargetJob,
    },
    nextCurrentAnswer:
      prevStep === "quiz"
        ? (wizardAnswers[wasQuiz ? 4 : 0] ?? "")
        : prevStep === "profile-upload" || prevStep === "target-job-url" || prevStep === "connect"
          ? ""
          : currentAnswer,
  };
}
