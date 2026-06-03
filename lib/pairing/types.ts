export type PairingTrack = "marketing" | "sales" | "fde";

export type UserStatus = "waiting" | "matched" | "inactive";

export type GroupStatus = "forming" | "locked";

export interface PairingUser {
  id: string;
  name: string;
  email: string;
  track: PairingTrack;
  status: UserStatus;
  joinedQueueAt: string;
  groupId: string | null;
  lastSeenAt: string;
}

export interface PairingGroup {
  id: string;
  track: PairingTrack;
  memberIds: string[];
  status: GroupStatus;
  createdAt: string;
  lockedAt: string | null;
}

export interface PairingStoreData {
  users: PairingUser[];
  groups: PairingGroup[];
  lastMatcherRunAt: string | null;
}

export type PairingMemberPublic = {
  id: string;
  name: string;
  email: string;
};

export type PairingStatusResponse =
  | {
      status: "waiting";
      groupId: null;
      track: PairingTrack;
      queuePosition: number;
      waitingInTrack: number;
    }
  | {
      status: "matched";
      groupId: string;
      track: PairingTrack;
      members: PairingMemberPublic[];
      lockedAt: string;
    }
  | {
      status: "inactive";
      groupId: string | null;
      track: PairingTrack;
    };
