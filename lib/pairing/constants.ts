import type { PairingTrack } from "@/lib/pairing/types";

export const PAIRING_TIMEOUT_MS = 10 * 60 * 1000;

export const PAIRING_MATCHER_INTERVAL_MS = 30 * 1000;

export const PAIRING_INACTIVE_MS = 15 * 60 * 1000;

export const PAIRING_MAX_GROUP_SIZE = 4;

export const PAIRING_MIN_GROUP_SIZE = 2;

export const PAIRING_TRACKS: PairingTrack[] = ["marketing", "sales", "fde"];

export const PAIRING_TRACK_LABELS: Record<PairingTrack, string> = {
  marketing: "Marketing",
  sales: "Sales",
  fde: "Forward Deployed Engineer",
};

export const PAIRING_TRACK_DESCRIPTIONS: Record<PairingTrack, string> = {
  marketing:
    "Pair with others running the marketing sprint—campaign, content pipeline, and public metrics.",
  sales:
    "Pair with others running the sales sprint—ICP, outbound sequences, and discovery calls.",
  fde: "Pair with others running the FDE sprint—customer POC, demo, and technical walkthrough.",
};

/** Map project sprint slug → pairing track id */
export function sprintSlugToPairingTrack(slug: string): PairingTrack | null {
  switch (slug) {
    case "marketing":
      return "marketing";
    case "sales":
      return "sales";
    case "forward-deployed-engineer":
      return "fde";
    default:
      return null;
  }
}

/** Map AI / project sprint track record → pairing queue track */
export function aiTrackToPairingTrack(track: { id: string; slug?: string }): PairingTrack | null {
  if (track.slug) {
    const fromSlug = sprintSlugToPairingTrack(track.slug);
    if (fromSlug) {
      return fromSlug;
    }
  }
  return sprintSlugToPairingTrack(track.id);
}

export function pairingTrackToSprintSlug(track: PairingTrack): string {
  return track === "fde" ? "forward-deployed-engineer" : track;
}

/** Map cc-agent inferred role id → pairing queue track */
export function roleIdToPairingTrack(roleId: string): PairingTrack | null {
  switch (roleId) {
    case "sales":
      return "sales";
    case "marketing":
      return "marketing";
    case "fde":
      return "fde";
    case "swe":
    case "long-tail":
      return "marketing";
    default:
      return null;
  }
}
