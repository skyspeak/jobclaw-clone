import Link from "next/link";

import { Button } from "@/components/ui/button";
import { projectSprintPath, type ProjectSprintSlug } from "@/lib/ai-tracks-data";

type ProjectSprintNavProps = {
  sprintSlug: ProjectSprintSlug;
  sprintTitle: string;
};

export function ProjectSprintNav({ sprintSlug, sprintTitle }: ProjectSprintNavProps) {
  return (
    <nav className="flex flex-wrap gap-3" aria-label="Sprint navigation">
      <Button variant="outline" asChild className="rounded-2xl">
        <Link href={projectSprintPath(sprintSlug)}>{sprintTitle} sprint</Link>
      </Button>
      <Button variant="ghost" asChild className="rounded-2xl">
        <Link href="/">Home</Link>
      </Button>
    </nav>
  );
}
