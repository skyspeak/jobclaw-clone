export const CREATE_NEWSLETTER_SUBSCRIBERS_TABLE = `
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at          TEXT DEFAULT (datetime('now')),
  email               TEXT NOT NULL UNIQUE,
  name                TEXT,
  role                TEXT,
  industry            TEXT,
  focus_areas         TEXT,
  timezone            TEXT,
  linkedin_url        TEXT,
  source              TEXT,
  unsubscribe_token   TEXT NOT NULL,
  unsubscribed_at     TEXT,
  welcome_sent_at     TEXT,
  last_issue_sent_at  TEXT
);
`;

export type NewsletterSubscriber = {
  id: number;
  created_at: string;
  email: string;
  name: string | null;
  role: string | null;
  industry: string | null;
  focus_areas: string[];
  timezone: string | null;
  linkedin_url: string | null;
  source: string | null;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  welcome_sent_at: string | null;
  last_issue_sent_at: string | null;
};

export type NewsletterSubscriberInsert = {
  email: string;
  name?: string | null;
  role?: string | null;
  industry?: string | null;
  focusAreas?: string[];
  timezone?: string | null;
  linkedinUrl?: string | null;
  source?: string | null;
};
