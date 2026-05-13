"use client";

import type { ComponentProps } from "react";
import { forwardRef, useId } from "react";
import { Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceInput } from "@/lib/use-voice-input";
import { cn } from "@/lib/utils";

type TextareaProps = Omit<ComponentProps<typeof Textarea>, "value" | "onChange">;

type VoiceTextareaProps = TextareaProps & {
  value: string;
  onValueChange: (value: string) => void;
  micLabel?: string;
  wrapperClassName?: string;
  micDisabled?: boolean;
};

export const VoiceTextarea = forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(function VoiceTextarea(
  {
    value,
    onValueChange,
    micLabel = "Speak your answer",
    wrapperClassName,
    micDisabled,
    className,
    id,
    "aria-describedby": ariaDescribedBy,
    ...textareaProps
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const statusId = `${fieldId}-voice-status`;
  const unavailableId = `${fieldId}-voice-unavailable`;

  const { isListening, voiceStatus, voiceError, voiceSupported, voiceChecked, toggle } = useVoiceInput({
    value,
    onChange: onValueChange,
  });

  const voiceDescribedBy =
    voiceStatus || voiceError
      ? statusId
      : voiceChecked && !voiceSupported
        ? unavailableId
        : undefined;

  const describedBy = [ariaDescribedBy, voiceDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <div className="relative">
        <Textarea
          {...textareaProps}
          ref={ref}
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-describedby={describedBy}
          className={cn(
            "min-h-[120px] resize-none rounded-2xl border-border/70 bg-card py-4 pl-4 pr-14 text-base leading-relaxed shadow-sm focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/60 sm:min-h-[160px] sm:pr-16 sm:text-lg",
            className,
          )}
        />
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="icon"
          className={cn(
            "absolute right-2 top-2 h-10 w-10 shrink-0 rounded-full border-border/70 sm:right-3 sm:top-3",
            isListening && "border-primary/40 bg-primary text-primary-foreground",
          )}
          aria-label={isListening ? "Stop voice input" : micLabel}
          aria-pressed={isListening}
          disabled={Boolean(micDisabled) || !voiceChecked || !voiceSupported}
          title={
            !voiceChecked
              ? "Checking voice support…"
              : !voiceSupported
                ? "Voice input is not available in this browser"
                : isListening
                  ? "Stop recording"
                  : micLabel
          }
          onClick={toggle}
        >
          <Mic className="h-4 w-4" strokeWidth={2.25} />
        </Button>
      </div>
      {voiceStatus || voiceError ? (
        <p
          id={statusId}
          className={cn("text-sm text-muted-foreground", voiceError && "text-destructive")}
          aria-live="polite"
        >
          {voiceError || voiceStatus}
        </p>
      ) : voiceChecked && !voiceSupported ? (
        <p id={unavailableId} className="text-sm text-muted-foreground" aria-live="polite">
          Voice input is not available in this browser. Typing still works.
        </p>
      ) : null}
    </div>
  );
});
