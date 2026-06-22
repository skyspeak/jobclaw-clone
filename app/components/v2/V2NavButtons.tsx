"use client";

type V2NavButtonsProps = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
};

export function V2NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  showBack = true,
}: V2NavButtonsProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-card)] px-5 py-2.5 text-sm font-medium text-[var(--v2-fg)] transition hover:bg-[var(--v2-teal-light)]"
        >
          Back
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full bg-[var(--v2-primary)] px-6 py-2.5 text-sm font-medium text-[var(--v2-primary-fg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  );
}
