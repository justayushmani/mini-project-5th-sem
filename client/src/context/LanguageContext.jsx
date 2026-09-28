import { createContext, useContext, useState } from 'react';

const LANGUAGES = {
  en:       { code: 'en',       label: 'English',  flag: '🇬🇧' },
  hi:       { code: 'hi',       label: 'हिन्दी',    flag: '🇮🇳' },
  hinglish: { code: 'hinglish', label: 'Hinglish',  flag: '🇮🇳' },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('ys_language') || 'en'
  );

  const changeLanguage = (code) => {
    if (!LANGUAGES[code]) return;
    setLanguage(code);
    localStorage.setItem('ys_language', code);
  };

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
