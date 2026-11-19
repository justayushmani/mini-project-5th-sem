import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n/i18n.js';
import authService from '../services/auth.service.js';

const LANGUAGES = {
  en: { code: 'en', label: 'English', flag: '🇬🇧', speechLang: 'en-IN' },
  hi: { code: 'hi', label: 'हिन्दी',   flag: '🇮🇳', speechLang: 'hi-IN' },
  bn: { code: 'bn', label: 'বাংলা',    flag: '🇮🇳', speechLang: 'bn-IN' },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem('ys_language');
    if (stored === 'bn' || stored === 'hi' || stored === 'en') {
      return stored;
    }
    // Fallback if legacy hinglish or invalid
    if (stored === 'hinglish') {
      localStorage.setItem('ys_language', 'en');
    }
    return 'en';
  });

  // Ensure i18n matches initial language state
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const changeLanguage = useCallback(async (code) => {
    if (!LANGUAGES[code]) return;
    setLanguageState(code);
    localStorage.setItem('ys_language', code);
    await i18n.changeLanguage(code);

    // Sync to DB if user is logged in
    try {
      await authService.updateLanguage(code);
    } catch {
      // Ignore if user is unauthenticated or network error
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
