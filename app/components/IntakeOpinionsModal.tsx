"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type IntakeOpinionsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  onAccept: (email: string) => Promise<void>;
  onDecline: () => void;
};

export function IntakeOpinionsModal({
  open,
  onOpenChange,
  defaultEmail = "",
  onAccept,
  onDecline,
}: IntakeOpinionsModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setError("");
    }
  }, [defaultEmail, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  async function handleAccept(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onAccept(trimmed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-opinions-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-t-3xl border border-border/70 bg-background pb-[max(0px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {BRAND_NAME} · Stay Relevant
            </p>
            <h2 id="intake-opinions-modal-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
              Can we contact you for occasional opinions?
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 touch-manipulation rounded-xl"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <form className="space-y-5 px-5 py-5 sm:px-6" onSubmit={(event) => void handleAccept(event)}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ll reach out sparingly — quick takes on tools, sprints, and what actually helps you stay
            competitive. No spam.
          </p>

          <div className="space-y-2">
            <Label htmlFor="intake-opinions-email">Email</Label>
            <Input
              id="intake-opinions-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl text-base sm:h-11"
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cta-glow min-h-11 h-12 flex-1 touch-manipulation rounded-xl sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Yes, stay in touch"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="min-h-11 h-12 touch-manipulation rounded-xl sm:min-w-[120px]"
              onClick={onDecline}
            >
              No thanks
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
