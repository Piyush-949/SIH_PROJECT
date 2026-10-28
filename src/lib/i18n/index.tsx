"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";

export type Language = "en" | "hi";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
  isHindi: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: en,
  isHindi: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("krishi_language") as Language;
      if (savedLang === "en" || savedLang === "hi") {
        setLanguageState(savedLang);
      }
    } catch {
      // localStorage may not be available in SSR
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("krishi_language", lang);
    } catch {
      // Ignore
    }
  };

  const t = language === "hi" ? hi : en;
  const isHindi = language === "hi";

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isHindi }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  return context;
}

export function useLanguage() {
  const { language, setLanguage, isHindi } = useContext(I18nContext);
  return { language, setLanguage, isHindi };
}
