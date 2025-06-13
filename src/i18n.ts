import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations using http
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    supportedLngs: ['en', 'ar'],
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    ns: ['common', 'orders', 'customers', 'services', 'auth'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Function to set HTML dir attribute based on language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
});

export default i18n;