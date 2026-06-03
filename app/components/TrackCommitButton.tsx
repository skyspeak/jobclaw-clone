import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrackCommitButton({
  trackId,
  className,
}: {
  trackId: string;
  className?: string;
}) {
  return (
    <Button
      asChild
      size="lg"
      className={cn("cta-glow h-11 shrink-0 rounded-2xl px-5 sm:px-6", className)}
    >
      <Link href={`/ai-tracks/commit?track=${encodeURIComponent(trackId)}`}>
        I want to commit to this
        <ArrowRight className="size-4 opacity-90" />
      </Link>
    </Button>
  );
}
