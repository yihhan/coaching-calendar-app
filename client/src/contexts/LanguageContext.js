import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext();

const fallbackLanguage = 'en';

const resolveTranslation = (language, key) => {
  const segments = key.split('.');
  let result = translations[language];

  for (const segment of segments) {
    if (result && Object.prototype.hasOwnProperty.call(result, segment)) {
      result = result[segment];
    } else {
      return null;
    }
  }

  return typeof result === 'string' || Array.isArray(result) ? result : null;
};

const applyReplacements = (value, replacements = {}) => {
  if (typeof value !== 'string') {
    return value;
  }

  return Object.entries(replacements).reduce((output, [token, tokenValue]) => {
    const pattern = new RegExp(`{{\\s*${token}\\s*}}`, 'g');
    return output.replace(pattern, tokenValue);
  }, value);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const translate = useCallback(
    (key, replacements) => {
      const primary = resolveTranslation(language, key);
      if (primary !== null && primary !== undefined) {
        return applyReplacements(primary, replacements);
      }

      const fallback = resolveTranslation(fallbackLanguage, key);
      if (fallback !== null && fallback !== undefined) {
        return applyReplacements(fallback, replacements);
      }

      return key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translate
    }),
    [language, translate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

