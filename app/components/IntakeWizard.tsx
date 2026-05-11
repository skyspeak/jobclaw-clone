"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Loader2, Mic, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { appendChip, type PrefsValues, QUESTIONS } from "@/lib/intake-questions";
import {
  getSpeechRecognitionConstructor,
  getVoiceErrorMessage,
  isLikelyMobileDevice,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";
import { cn } from "@/lib/utils";

type IntakeWizardProps = {
  step: number;
  totalSteps: number;
  currentAnswer: string;
  onCurrentAnswerChange: (value: string) => void;
  answerError: string;
  prefsForm: UseFormReturn<PrefsValues>;
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  contactEmail: string;
  onContactEmailChange: (value: string) => void;
  contactPhone: string;
  onContactPhoneChange: (value: string) => void;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
};

export function IntakeWizard({
  step,
  totalSteps,
  currentAnswer,
  onCurrentAnswerChange,
  answerError,
  prefsForm,
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
  profileCompleteForGenerate,
  profileIncompleteHint,
  onBack,
  onNext,
  onGenerate,
  isGenerating,
}: IntakeWizardProps) {
  const currentQuestion = step < 5 ? QUESTIONS[step] : null;

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);

  const abortRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.abort();
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supportCheckId = window.setTimeout(() => {
      setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
      setVoiceChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(supportCheckId);
      abortRecognition();
    };
  }, [abortRecognition]);

  useEffect(() => {
    abortRecognition();
    const id = window.setTimeout(() => {
      setIsListening(false);
      setVoiceStatus("");
      setVoiceError("");
    }, 0);
    return () => {
      window.clearTimeout(id);
      abortRecognition();
    };
  }, [step, abortRecognition]);

  const toggleVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus("Adding your voice answer...");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not available in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    const isMobileVoiceInput = isLikelyMobileDevice();
    const listeningStatus = isMobileVoiceInput
      ? "Listening… speak your answer. Mobile browsers may stop automatically after a pause."
      : "Listening… speak your answer, then tap the microphone again to stop.";

    recognition.continuous = !isMobileVoiceInput;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    voiceBaseRef.current = currentAnswer;
    recognitionRef.current = recognition;
    setVoiceError("");
    setVoiceStatus(listeningStatus);
    setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const nextDraft = [voiceBaseRef.current, finalTranscript, interimTranscript]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ");

      onCurrentAnswerChange(nextDraft);

      if (finalTranscript.trim()) {
        voiceBaseRef.current = [voiceBaseRef.current, finalTranscript.trim()].filter(Boolean).join(" ");
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(getVoiceErrorMessage(event.error));
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus((currentStatus) =>
        currentStatus === listeningStatus
          ? "Voice input stopped. Review your answer, then continue."
          : currentStatus,
      );
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("Voice input could not start. Check microphone permissions and try again.");
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [currentAnswer, onCurrentAnswerChange]);

  return (
    <div className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-32 pt-5 sm:px-6 sm:pb-12 md:px-12 md:pt-12">
        <header className="mb-6 flex flex-col gap-3 sm:mb-10">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground sm:text-sm">
            <Link className="tracking-wide text-foreground underline-offset-4 hover:underline" href="/">
              JOBCLAW
            </Link>
            <span>
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5 sm:h-2" />
          <Link
            href="/"
            className="w-fit text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to home
          </Link>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-1 flex-col duration-500" key={step}>
          {currentQuestion ? (
            <div className="space-y-5 sm:space-y-7">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  {currentQuestion.prompt}
                </h2>
                {currentQuestion.hint ? (
                  <p className="text-sm text-muted-foreground sm:text-base">{currentQuestion.hint}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                  Type or speak your answer
                </Label>
                <div className="relative">
                  <Textarea
                    placeholder="In your own words..."
                    className="min-h-[120px] resize-none rounded-2xl border-border/70 bg-card py-4 pl-4 pr-14 text-base leading-relaxed shadow-sm focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/60 sm:min-h-[160px] sm:pr-16 sm:text-lg"
                    data-testid={`textarea-q${step + 1}`}
                    value={currentAnswer}
                    onChange={(e) => onCurrentAnswerChange(e.target.value)}
                    aria-describedby={
                      voiceStatus || voiceError
                        ? `voice-status-q${step + 1}`
                        : voiceChecked && !voiceSupported
                          ? `voice-unavailable-q${step + 1}`
                          : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "absolute right-2 top-2 h-10 w-10 shrink-0 rounded-full border-border/70 sm:right-3 sm:top-3",
                      isListening && "border-primary/40 bg-primary text-primary-foreground",
                    )}
                    data-testid={`button-voice-q${step + 1}`}
                    aria-label={isListening ? "Stop voice input" : "Speak your answer"}
                    aria-pressed={isListening}
                    disabled={!voiceChecked || !voiceSupported || isGenerating}
                    title={
                      !voiceChecked
                        ? "Checking voice support…"
                        : !voiceSupported
                          ? "Voice input is not available in this browser"
                          : isListening
                            ? "Stop recording"
                            : "Speak your answer"
                    }
                    onClick={toggleVoiceInput}
                  >
                    <Mic className="h-4 w-4" strokeWidth={2.25} />
                  </Button>
                </div>
                {answerError ? <p className="text-sm font-medium text-destructive">{answerError}</p> : null}
                {voiceStatus || voiceError ? (
                  <p
                    id={`voice-status-q${step + 1}`}
                    className={cn("text-sm text-muted-foreground", voiceError && "text-destructive")}
                    aria-live="polite"
                  >
                    {voiceError || voiceStatus}
                  </p>
                ) : voiceChecked && !voiceSupported ? (
                  <p
                    id={`voice-unavailable-q${step + 1}`}
                    className="text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    Voice input is not available in this browser. Typing still works.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                  Or pick a starting point
                </Label>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = currentAnswer.toLowerCase().includes(opt.toLowerCase());
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onCurrentAnswerChange(appendChip(currentAnswer, opt))}
                        data-testid={`chip-q${step + 1}-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                        className={[
                          "inline-flex touch-manipulation items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                          "active:scale-[0.97]",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/70 bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
                        ].join(" ")}
                      >
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        )}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Search Preferences
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Optional filters to help narrow down the roles.
                </p>
              </div>

              <Form {...prefsForm}>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <FormField
                      control={prefsForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Location</Label>
                          <FormControl>
                            <Input
                              placeholder="e.g. New York, Remote"
                              data-testid="input-location"
                              className="h-11 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={prefsForm.control}
                      name="workMode"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Work Mode</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-workmode" className="h-11 rounded-xl">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Any">Any</SelectItem>
                              <SelectItem value="Remote">Remote</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                              <SelectItem value="On-site">On-site</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={prefsForm.control}
                      name="seniority"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Seniority</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-seniority" className="h-11 rounded-xl">
                                <SelectValue placeholder="Select seniority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Any">Any</SelectItem>
                              <SelectItem value="Internship">Internship</SelectItem>
                              <SelectItem value="Entry level">Entry level</SelectItem>
                              <SelectItem value="Associate">Associate</SelectItem>
                              <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                              <SelectItem value="Director">Director</SelectItem>
                              <SelectItem value="Executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={prefsForm.control}
                      name="minSalary"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Minimum Salary</Label>
                          <FormControl>
                            <Input
                              placeholder="e.g. $70,000"
                              data-testid="input-minsalary"
                              className="h-11 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={prefsForm.control}
                      name="maxResults"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Max Results</Label>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              data-testid="input-maxresults"
                              className="h-11 rounded-xl"
                              value={Number.isFinite(field.value) ? field.value : ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === "" ? 5 : Number.parseInt(v, 10));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      control={prefsForm.control}
                      name="requireVisaSponsorship"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
                          <div className="space-y-0.5 pr-4">
                            <Label className="text-sm sm:text-base">Visa Sponsorship</Label>
                            <div className="text-xs text-muted-foreground sm:text-sm">
                              Require sponsorship to work
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-visa" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={prefsForm.control}
                      name="preferVolunteerRoles"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
                          <div className="space-y-0.5 pr-4">
                            <Label className="text-sm sm:text-base">Volunteer Roles</Label>
                            <div className="text-xs text-muted-foreground sm:text-sm">
                              Prefer unpaid / non-profit work
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-volunteer"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={prefsForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Additional Notes</Label>
                        <FormControl>
                          <Textarea
                            placeholder="Any other context?"
                            className="resize-none rounded-2xl border-border/70 bg-card"
                            data-testid="textarea-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Resume &amp; LinkedIn
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Add your LinkedIn profile, a résumé file we can read, and how we can reach you. You must provide at least
                  one of: LinkedIn URL, uploaded résumé (text-based file), email, or phone number before generating your
                  brief.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="intake-contact-email">Email</Label>
                  <Input
                    id="intake-contact-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                    data-testid="input-contact-email"
                    value={contactEmail}
                    onChange={(e) => onContactEmailChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-contact-phone">Phone number</Label>
                  <Input
                    id="intake-contact-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(555) 123-4567"
                    className="h-11 rounded-xl"
                    data-testid="input-contact-phone"
                    value={contactPhone}
                    onChange={(e) => onContactPhoneChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intake-linkedin-url">LinkedIn profile URL</Label>
                <Input
                  id="intake-linkedin-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className="h-11 rounded-xl"
                  data-testid="input-linkedin-url"
                  value={linkedInUrl}
                  onChange={(e) => onLinkedInUrlChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intake-resume-upload">Upload resume (text-based files)</Label>
                <Input
                  id="intake-resume-upload"
                  type="file"
                  accept=".txt,.md,.rtf,.csv,.json"
                  className="h-11 cursor-pointer rounded-xl pt-2.5 file:mr-3"
                  data-testid="input-resume-file"
                  onChange={onResumeFile}
                />
                {resumeFileName ? (
                  <p className="text-xs text-muted-foreground">Uploaded: {resumeFileName}</p>
                ) : null}
                {isReadingResume ? <p className="text-sm text-muted-foreground">Reading file…</p> : null}
                <p className="text-xs text-muted-foreground">
                  Plain text (.txt, .md, …). PDF or Word files are not read here—export to text and upload that file.
                </p>
              </div>

              {!profileCompleteForGenerate ? (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {profileIncompleteHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:relative sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="mx-auto w-full max-w-2xl sm:px-6 md:px-12 sm:pb-10">
          <div className="flex items-center justify-between gap-3 sm:border-t sm:border-border/50 sm:pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={step === 0 || isGenerating}
              className="h-12 rounded-2xl px-5"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>

            {step < 6 ? (
              <Button
                type="button"
                onClick={onNext}
                className="cta-glow h-12 flex-1 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none sm:px-8"
                data-testid="button-next"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || (step === 6 && !profileCompleteForGenerate)}
                className="cta-glow h-12 flex-1 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 sm:px-8"
                data-testid="button-submit"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    Generate Brief <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
