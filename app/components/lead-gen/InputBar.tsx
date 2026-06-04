"use client";

type InputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputType?: "text" | "email";
  submitLabel?: string;
  autoFocus?: boolean;
};

export function InputBar({
  value,
  onChange,
  onSubmit,
  placeholder = "type your reply…",
  disabled = false,
  inputType = "text",
  submitLabel = "send",
  autoFocus = false,
}: InputBarProps) {
  return (
    <form
      className="flex gap-2 p-4 pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && value.trim()) {
          onSubmit();
        }
      }}
    >
      <input
        type={inputType}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] px-4 py-3 text-sm text-[var(--lg-fg)] outline-none placeholder:text-[var(--lg-muted)] focus:border-[var(--lg-accent)]"
        autoComplete={inputType === "email" ? "email" : "off"}
        autoFocus={autoFocus}
        enterKeyHint={inputType === "email" ? "send" : "enter"}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-xl border border-[var(--lg-border)] px-4 py-3 text-sm text-[var(--lg-fg)] transition hover:border-[var(--lg-accent)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  );
}
