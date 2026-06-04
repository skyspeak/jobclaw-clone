export type LeadGenTheme = "dark" | "light";

export const LEAD_GEN_THEME_STORAGE_KEY = "dearcc.lead-gen.theme";

export const LEAD_GEN_THEMES: LeadGenTheme[] = ["dark", "light"];

export function isLeadGenTheme(value: string | null | undefined): value is LeadGenTheme {
  return value === "dark" || value === "light";
}
