import { readIntakeSession } from "@/lib/intake-session";

export const STAY_RELEVANT_CONTACT_STORAGE_KEY = "dearcc.stay-relevant.contact.v1";

export type StayRelevantContact = {
  email: string;
  name?: string;
  phone?: string;
};

function normalizeContact(input: Partial<StayRelevantContact> | null | undefined): StayRelevantContact | null {
  const email = input?.email?.trim() ?? "";
  if (!email) {
    return null;
  }

  return {
    email,
    name: input?.name?.trim() || undefined,
    phone: input?.phone?.trim() || undefined,
  };
}

export function readStayRelevantContact(): StayRelevantContact | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STAY_RELEVANT_CONTACT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StayRelevantContact>;
    return normalizeContact(parsed);
  } catch {
    return null;
  }
}

export function writeStayRelevantContact(input: Partial<StayRelevantContact>): StayRelevantContact | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = readStayRelevantContact();
  const next = normalizeContact({
    email: input.email ?? existing?.email,
    name: input.name ?? existing?.name,
    phone: input.phone ?? existing?.phone,
  });

  if (!next) {
    return null;
  }

  window.localStorage.setItem(STAY_RELEVANT_CONTACT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Stay Relevant store first, then intake session contact. */
export function readStayRelevantContactWithIntakeFallback(): StayRelevantContact | null {
  const dedicated = readStayRelevantContact();
  if (dedicated) {
    return dedicated;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const intake = readIntakeSession();
  return normalizeContact({
    email: intake.contact.email,
    name: intake.contact.name,
    phone: intake.contact.phone,
  });
}
