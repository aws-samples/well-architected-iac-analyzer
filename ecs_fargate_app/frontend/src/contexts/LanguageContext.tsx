import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, i18nStrings, I18nStrings } from '../i18n/strings';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  strings: I18nStrings;
  getString: (category: keyof I18nStrings, key: string) => string;
  getNestedString: (category: keyof I18nStrings, subcategory: string, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = 'wa-analyzer-language';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return (stored === 'ja' || stored === 'en') ? stored : 'en';
    } catch {
      return 'en';
    }
  });

  // Update localStorage when language changes
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const strings = i18nStrings[language];

  // Helper function to get string from a category
  const getString = (category: keyof I18nStrings, key: string): string => {
    const categoryStrings = strings[category] as any;
    if (categoryStrings && typeof categoryStrings[key] === 'string') {
      return categoryStrings[key];
    }
    
    // Fallback to English if string not found
    const fallbackStrings = i18nStrings.en[category] as any;
    if (fallbackStrings && typeof fallbackStrings[key] === 'string') {
      return fallbackStrings[key];
    }
    
    return key; // Return key as fallback
  };

  // Helper function to get nested string (e.g., app.navigation.sideNavigation)
  const getNestedString = (category: keyof I18nStrings, subcategory: string, key: string): string => {
    const categoryStrings = strings[category] as any;
    if (categoryStrings && categoryStrings[subcategory] && typeof categoryStrings[subcategory][key] === 'string') {
      return categoryStrings[subcategory][key];
    }
    
    // Fallback to English if string not found
    const fallbackStrings = i18nStrings.en[category] as any;
    if (fallbackStrings && fallbackStrings[subcategory] && typeof fallbackStrings[subcategory][key] === 'string') {
      return fallbackStrings[subcategory][key];
    }
    
    return key; // Return key as fallback
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    strings,
    getString,
    getNestedString,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenience hooks for common use cases
export const useStrings = () => {
  const { strings } = useLanguage();
  return strings;
};

export const useCurrentLanguage = () => {
  const { language } = useLanguage();
  return language;
};
