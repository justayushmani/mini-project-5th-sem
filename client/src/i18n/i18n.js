import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
};

// Handle migration: if legacy 'hinglish' was stored in localStorage, fall back to 'en'
const storedLang = localStorage.getItem('ys_language');
const initialLang = (storedLang === 'bn' || storedLang === 'hi' || storedLang === 'en')
  ? storedLang
  : 'en';

if (storedLang === 'hinglish') {
  localStorage.setItem('ys_language', 'en');
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'bn'],
    interpolation: {
      escapeValue: false, // React already prevents XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ys_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
