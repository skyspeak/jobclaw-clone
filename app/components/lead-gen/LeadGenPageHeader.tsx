import Link from "next/link";

import { LeadGenThemeToggle } from "@/app/components/lead-gen/LeadGenThemeToggle";
import { BRAND_NAME } from "@/lib/brand";

type LeadGenPageHeaderProps = {
  endSlot?: React.ReactNode;
};

export function LeadGenPageHeader({ endSlot }: LeadGenPageHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link
        href="/"
        className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--lg-fg)] underline-offset-4 hover:underline sm:text-sm"
      >
        {BRAND_NAME}
      </Link>
      <div className="flex items-center gap-3">
        {endSlot}
        <LeadGenThemeToggle />
      </div>
    </header>
  );
}
