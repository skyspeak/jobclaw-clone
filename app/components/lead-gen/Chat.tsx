"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { InputBar } from "@/app/components/lead-gen/InputBar";
import { LeadGenThemeToggle } from "@/app/components/lead-gen/LeadGenThemeToggle";
import { Message } from "@/app/components/lead-gen/Message";
import { BRAND_NAME } from "@/lib/brand";
import { ROLE_TYPES, type RoleType } from "@/lib/leads/schema";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  animate?: boolean;
};

type LeadFormData = {
  name: string;
  email: string;
  role_type: RoleType | "";
  linkedin: string;
  referral: string;
};

const EMPTY_DATA: LeadFormData = {
  name: "",
  email: "",
  role_type: "",
  linkedin: "",
  referral: "",
};

const TOTAL_STEPS = 5;

function botCopy(step: number): string {
  switch (step) {
    case 0:
      return "hey 👋 i'm dear[CC]. I help you land your first job with AI native skills. what's your name?";
    case 1:
      return "are you looking for a full-time role, an internship, or both?";
    case 2:
      return "drop your LinkedIn if you have one (totally optional)";
    case 3:
      return "how'd you hear about us?";
    case 4:
      return "last one — what's your email so we can have our team reach out and get you ready?";
    case 5:
      return "you're in. our team will reach out to you in 1 week or less ✦";
    default:
      return "";
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function roleLabel(value: RoleType): string {
  if (value === "full-time") return "full-time";
  if (value === "internship") return "internship";
  return "both";
}

export function Chat() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<LeadFormData>(EMPTY_DATA);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const stepRef = useRef(step);
  const dataRef = useRef(data);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  stepRef.current = step;
  dataRef.current = data;

  const progress = useMemo(() => {
    if (step >= TOTAL_STEPS) return 100;
    return Math.round((step / TOTAL_STEPS) * 100);
  }, [step]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, step, scrollToBottom]);

  const appendBot = useCallback((nextStep: number) => {
    setIsTyping(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${nextStep}-${prev.length}`,
        role: "bot",
        text: botCopy(nextStep),
        animate: true,
      },
    ]);
  }, []);

  const handleBotTyped = useCallback(() => {
    setIsTyping(false);
  }, []);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    appendBot(0);
  }, [appendBot]);

  const advanceAfterReply = useCallback(
    (userText: string, patch: Partial<LeadFormData>, nextStep: number) => {
      setError("");
      setMessages((prev) => [
        ...prev,
        { id: `user-${stepRef.current}-${prev.length}`, role: "user", text: userText },
      ]);
      setInput("");

      const nextData = { ...dataRef.current, ...patch };
      setData(nextData);
      dataRef.current = nextData;

      window.setTimeout(() => {
        setStep(nextStep);
        appendBot(nextStep);
      }, 400);
    },
    [appendBot],
  );

  const submitLead = useCallback(
    async (form: LeadFormData) => {
      setIsSubmitting(true);
      setError("");

      try {
        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role_type: form.role_type,
            linkedin: form.linkedin || null,
            referral: form.referral || null,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "submit failed");
        }

        setStep(TOTAL_STEPS);
        window.setTimeout(() => {
          appendBot(TOTAL_STEPS);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#e8ff47", "#f0f0f0", "#1a1a1a"],
            ticks: 200,
          });
        }, 400);
      } catch {
        setError("something went wrong — try again in a sec.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [appendBot],
  );

  function handleTextSubmit() {
    const value = input.trim();
    if (!value || isTyping || isSubmitting) {
      return;
    }

    if (step === 0) {
      advanceAfterReply(value, { name: value }, 1);
      return;
    }

    if (step === 3) {
      advanceAfterReply(value, { referral: value }, 4);
      return;
    }

    if (step === 4) {
      if (!isValidEmail(value)) {
        setError("that doesn't look like an email — try again?");
        return;
      }
      const nextData = { ...dataRef.current, email: value };
      setMessages((prev) => [
        ...prev,
        { id: `user-${step}-${prev.length}`, role: "user", text: value },
      ]);
      setInput("");
      setData(nextData);
      dataRef.current = nextData;
      void submitLead(nextData);
    }
  }

  function handleRoleSelect(role: RoleType) {
    if (isTyping || isSubmitting) {
      return;
    }
    advanceAfterReply(roleLabel(role), { role_type: role }, 2);
  }

  function handleLinkedinSkip() {
    if (isTyping || isSubmitting) {
      return;
    }
    advanceAfterReply("skip", { linkedin: "" }, 3);
  }

  function handleLinkedinSubmit() {
    const value = input.trim();
    if (!value) {
      handleLinkedinSkip();
      return;
    }
    advanceAfterReply(value, { linkedin: value }, 3);
  }

  function handleReferralSkip() {
    if (isTyping || isSubmitting) {
      return;
    }
    advanceAfterReply("skip", { referral: "" }, 4);
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("copied — paste it to a friend");
    } catch {
      setShareStatus("couldn't copy — try again");
    }
  }

  const showTextInput = step === 0 || step === 2 || step === 3 || step === 4;
  const showRoleButtons = step === 1 && !isTyping;
  const showLinkedinSkip = step === 2 && !isTyping;
  const showReferralSkip = step === 3 && !isTyping;
  const showConfirmationActions = step === TOTAL_STEPS && !isTyping;

  const inputPlaceholder =
    step === 4 ? "you@school.edu" : step === 2 ? "linkedin.com/in/you" : "type your reply…";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--lg-bg)] text-[var(--lg-fg)]">
      <div
        className="fixed left-0 top-0 z-20 h-0.5 bg-[var(--lg-accent)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      <header className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4 pt-4">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--lg-muted)]">
          {BRAND_NAME}
        </span>
        <LeadGenThemeToggle />
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-4"
      >
        {messages.map((message, index) => {
          const isLatestBot =
            message.role === "bot" && index === messages.length - 1 && message.animate;
          return (
            <Message
              key={message.id}
              role={message.role}
              text={message.text}
              animate={message.animate}
              onTyped={isLatestBot ? handleBotTyped : undefined}
            />
          );
        })}

        <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />

        {error ? <p className="text-center text-xs text-[var(--lg-accent)]">{error}</p> : null}

        <div className="min-h-[1px]">
          {showRoleButtons ? (
            <div className="flex flex-col gap-2">
              {ROLE_TYPES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="rounded-xl border border-[var(--lg-border)] px-4 py-3 text-left text-sm transition hover:border-[var(--lg-accent)]"
                >
                  {roleLabel(role)}
                </button>
              ))}
            </div>
          ) : null}

          {showConfirmationActions ? (
            <div className="flex flex-col items-center gap-3 pb-6">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="max-w-full rounded-xl border border-[var(--lg-border)] px-4 py-3 text-center text-sm transition hover:border-[var(--lg-accent)]"
              >
                send this to someone else who is looking
              </button>
              {shareStatus ? <p className="text-xs text-[var(--lg-muted)]">{shareStatus}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      {showTextInput ? (
        <div className="mx-auto w-full max-w-[480px] shrink-0">
          {showLinkedinSkip || showReferralSkip ? (
            <button
              type="button"
              onClick={showReferralSkip ? handleReferralSkip : handleLinkedinSkip}
              className="mb-2 w-full text-center text-xs text-[var(--lg-muted)] underline-offset-4 hover:text-[var(--lg-accent)] hover:underline"
            >
              skip
            </button>
          ) : null}
          <InputBar
            value={input}
            onChange={setInput}
            onSubmit={step === 2 ? handleLinkedinSubmit : handleTextSubmit}
            placeholder={inputPlaceholder}
            disabled={isTyping || isSubmitting}
            inputType={step === 4 ? "email" : "text"}
          />
        </div>
      ) : null}
    </div>
  );
}
