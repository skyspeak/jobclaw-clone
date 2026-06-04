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
      className="flex gap-2 border-t border-[#2a2a2a] bg-[#0a0a0a] p-4"
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
        className="min-w-0 flex-1 rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-sm text-[#f0f0f0] outline-none placeholder:text-[#555555] focus:border-[#e8ff47]"
        autoComplete={inputType === "email" ? "email" : "off"}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-xl border border-[#2a2a2a] px-4 py-3 text-sm text-[#f0f0f0] transition hover:border-[#e8ff47] disabled:cursor-not-allowed disabled:opacity-40"
      >
        send
      </button>
    </form>
  );
}
