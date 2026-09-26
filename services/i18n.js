import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import si from '../locales/si.json';
import ta from '../locales/ta.json';

const LANGUAGE_KEY = 'govilink_language';

const resources = {
  en: { translation: en },
  si: { translation: si },
  ta: { translation: ta },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default initial language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    compatibilityJSON: 'v3',
  });

// Async helper to load saved language on app startup
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && (savedLang === 'en' || savedLang === 'si' || savedLang === 'ta')) {
      await i18n.changeLanguage(savedLang);
      return savedLang;
    }
  } catch (err) {
    console.error('Failed to load saved language:', err);
  }
  return 'en';
};

// Global helper to change and persist language across restart/logout
export const changeAppLanguage = async (newLang) => {
  try {
    if (newLang && (newLang === 'en' || newLang === 'si' || newLang === 'ta')) {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
      await i18n.changeLanguage(newLang);
    }
  } catch (err) {
    console.error('Failed to save language choice:', err);
  }
};

export default i18n;
