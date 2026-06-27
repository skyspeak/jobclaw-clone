export const CREATE_LEADS_TABLE = `
CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  school     TEXT,
  grad_year  TEXT,
  role_type  TEXT,
  industries TEXT,
  linkedin   TEXT,
  referral   TEXT
);
`;

export type Lead = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  school: string | null;
  grad_year: string | null;
  role_type: string | null;
  industries: string | null;
  linkedin: string | null;
  referral: string | null;
};

export type LeadInsert = {
  name: string;
  email: string;
  school?: string | null;
  grad_year?: string | null;
  role_type?: string | null;
  industries?: string | null;
  linkedin?: string | null;
  phone?: string | null;
  referral?: string | null;
};

export const ROLE_TYPES = ["full-time", "internship", "both"] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export const INDUSTRY_OPTIONS = [
  "Tech",
  "Finance",
  "Healthcare",
  "Media",
  "Gov/Nonprofit",
  "Consulting",
  "Design",
  "Other",
] as const;
