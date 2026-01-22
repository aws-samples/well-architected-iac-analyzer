/**
 * Language configuration for the backend
 */

export interface Language {
  code: string;
  name: string;  // English name
  nativeName: string; // Name in the language itself
}

/**
 * Array of supported languages
 * When adding a new language:
 * 1. Add it here
 * 2. Add translations in the frontend
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español'
  },
  {
    code: 'pt_BR',
    name: 'Brazilian Portuguese',
    nativeName: 'Português Brasileiro'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français'
  }
  // Add more languages here
  // Example: Spanish
  // {
  //   code: 'es',
  //   name: 'Spanish',
  //   nativeName: 'Español'
  // }
];

/**
 * Get language name in English by code
 * @param code Language code
 * @returns Full language name in English
 */
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.name || 'English';
}

/**
 * Get native language name by code
 * @param code Language code
 * @returns Native language name
 */
export function getLanguageNativeName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.nativeName || 'English';
}

/**
 * Check if a language is supported
 * @param code Language code
 * @returns Whether the language is supported
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}