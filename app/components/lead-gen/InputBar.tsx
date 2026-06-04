"use client";

type InputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputType?: "text" | "email";
};

export function InputBar({
  value,
  onChange,
  onSubmit,
  placeholder = "type your reply…",
  disabled = false,
  inputType = "text",
}: InputBarProps) {
  return (
    <form
      className="flex gap-2 border-t border-[var(--lg-border)] bg-[var(--lg-bg)] p-4"
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
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-xl border border-[var(--lg-border)] px-4 py-3 text-sm text-[var(--lg-fg)] transition hover:border-[var(--lg-accent)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        send
      </button>
    </form>
  );
}
