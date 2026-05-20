"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type PrefsValues, QUESTIONS } from "@/lib/intake-questions";

import { IntakeOptionChips } from "./IntakeOptionChips";
import { VoiceTextarea } from "./VoiceTextarea";

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link
              href="/"
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Back to home
            </Link>
            <Link
              href="/intake/chat"
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Switch to chat view
            </Link>
          </div>
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
                <VoiceTextarea
                  key={`question-${step}`}
                  placeholder="In your own words..."
                  data-testid={`textarea-q${step + 1}`}
                  value={currentAnswer}
                  onValueChange={onCurrentAnswerChange}
                  micDisabled={isGenerating}
                  micLabel="Speak your answer"
                />
                {answerError ? <p className="text-sm font-medium text-destructive">{answerError}</p> : null}
              </div>

              <IntakeOptionChips
                options={currentQuestion.options}
                value={currentAnswer}
                onChange={onCurrentAnswerChange}
                stepIndex={step}
              />
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
                          <VoiceTextarea
                            placeholder="Any other context? Speak or type."
                            data-testid="textarea-notes"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            micLabel="Speak your notes"
                            micDisabled={isGenerating}
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
