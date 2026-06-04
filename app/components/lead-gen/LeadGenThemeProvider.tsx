"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  isLeadGenTheme,
  LEAD_GEN_THEME_STORAGE_KEY,
  type LeadGenTheme,
} from "@/lib/lead-gen-theme";

type LeadGenThemeContextValue = {
  theme: LeadGenTheme;
  setTheme: (theme: LeadGenTheme) => void;
  toggleTheme: () => void;
};

const LeadGenThemeContext = createContext<LeadGenThemeContextValue | null>(null);

export function useLeadGenTheme() {
  const context = useContext(LeadGenThemeContext);
  if (!context) {
    throw new Error("useLeadGenTheme must be used within LeadGenThemeProvider");
  }
  return context;
}

type LeadGenThemeProviderProps = {
  children: ReactNode;
  className?: string;
};

export function LeadGenThemeProvider({ children, className }: LeadGenThemeProviderProps) {
  const [theme, setThemeState] = useState<LeadGenTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LEAD_GEN_THEME_STORAGE_KEY);
    if (isLeadGenTheme(stored)) {
      setThemeState(stored);
    }
    setReady(true);
  }, []);

  const setTheme = useCallback((next: LeadGenTheme) => {
    setThemeState(next);
    localStorage.setItem(LEAD_GEN_THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <LeadGenThemeContext.Provider value={value}>
      <div
        className={["lead-gen min-h-dvh font-mono", className].filter(Boolean).join(" ")}
        data-theme={ready ? theme : "dark"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LeadGenThemeContext.Provider>
  );
}
