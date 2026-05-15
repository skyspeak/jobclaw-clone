import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TrackCommitButton({ trackId }: { trackId: string }) {
  return (
    <Button asChild size="lg" className="cta-glow mt-8 h-12 w-full rounded-2xl sm:w-auto sm:px-8">
      <Link href={`/ai-tracks/commit?track=${encodeURIComponent(trackId)}`}>
        I want to commit to this
        <ArrowRight className="size-4 opacity-90" />
      </Link>
    </Button>
  );
}
