import { PAIRING_TRACK_LABELS } from "@/lib/pairing/constants";
import type { PairingStoreData, PairingTrack } from "@/lib/pairing/types";
import { syncPairingGroup } from "@/lib/database/groups";

export async function syncPairingStoreToDatabase(data: PairingStoreData): Promise<void> {
  for (const group of data.groups) {
    const members = group.memberIds
      .map((id) => data.users.find((user) => user.id === id))
      .filter((user): user is NonNullable<typeof user> => Boolean(user));

    await syncPairingGroup({
      groupId: group.id,
      name: `${PAIRING_TRACK_LABELS[group.track as PairingTrack]} cohort`,
      pairingTrack: group.track,
      groupStatus: group.status,
      createdAt: group.createdAt,
      lockedAt: group.lockedAt,
      members: members.map((member, index) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: index === 0 ? "owner" : "member",
      })),
    });
  }
}
