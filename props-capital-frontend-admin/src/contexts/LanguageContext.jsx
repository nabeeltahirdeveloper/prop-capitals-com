import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import enTranslations from '../locales/en.json';
import thTranslations from '../locales/th.json';
import frTranslations from '../locales/fr.json';
import esTranslations from '../locales/es.json';
import ruTranslations from '../locales/ru.json';
import trTranslations from '../locales/tr.json';
import krTranslations from '../locales/kr.json';
import jaTranslations from '../locales/ja.json';

// Helper function for nested value access
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

export const supportedLanguages = [
  {code: 'en', label: 'English'},
  {code: 'th', label: 'Thai'},
  {code: 'fr', label: 'French'},
  {code: 'es', label: 'Spanish'},
  {code: 'ru', label: 'Russian'},
  {code: 'tr', label: 'Turkish'},
  {code: 'kr', label: 'Korean'},
  {code: 'ja', label: 'Japanese'},
];

const translationsMap = {
  en: enTranslations,
  th: thTranslations,
  fr: frTranslations,
  es: esTranslations,
  ru: ruTranslations,
  tr: trTranslations,
  kr: krTranslations,
  ja: jaTranslations,
}

// Create default/fallback translation function
const createDefaultT = () => {
  const defaultLanguage = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'en') : 'en';
  const defaultTranslations = defaultLanguage === 'th' ? thTranslations : enTranslations;
  
  return (key, params = {}) => {
    try {
      let text = getNestedValue(defaultTranslations, key);
      if (text === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
      return text;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };
};

// Create context with default value to prevent errors
const defaultLanguage = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'en') : 'en';
const LanguageContext = createContext({
  language: defaultLanguage,
  setLanguage: () => {
    console.warn('setLanguage called outside LanguageProvider');
  },
  t: createDefaultT()
});

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  // Always return context (will be default if provider not available)
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const translations = useMemo(() => {
    return translationsMap[language] || translationsMap.en;
  }, [language]);

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const t = (key, params = {}) => {
    try {
      let text = getNestedValue(translations, key);

      if (text === undefined) {
        text = getNestedValue(translationsMap.en, key)
      }
      
      // If translation not found, return the key
      if (text === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      
      // If it's an array or object and returnObjects is true, return it as-is
      if (params.returnObjects && (Array.isArray(text) || typeof text === 'object')) {
        return text;
      }
      
      // If it's an array without returnObjects, return the first item (for backward compatibility)
      if (Array.isArray(text)) {
        return text;
      }
      
      // Replace parameters (only for strings)
      if (typeof text === 'string') {
        Object.keys(params).forEach(param => {
          if (param !== 'returnObjects') {
            text = text.replace(`{{${param}}}`, params[param]);
          }
        });
      }
      
      return text;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

