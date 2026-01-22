/**
 * Central definition of all supported languages in the application
 * This file serves as the single source of truth for language configuration
 */

export interface LanguageDefinition {
  code: string;         // ISO code, e.g., 'en', 'ja'
  label: string;        // Display name in English, e.g., 'English', 'Japanese' 
  nativeName: string;   // Native name, e.g., 'English', '日本語'
  isDefault?: boolean;  // Whether this is the default language
}

/**
 * SUPPORTED_LANGUAGES
 * 
 * To add a new language:
 * 1. Add a new entry to this array
 * 2. Create corresponding translations in strings.ts
 * 3. Only one language should have isDefault: true
 */
export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    isDefault: true
  },
  {
    code: 'ja',
    label: 'Japanese',
    nativeName: '日本語'
  },
  {
    code: 'ko',
    label: 'Korean',
    nativeName: '한국어'
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeName: 'Español'
  },
    {
    code: 'pt_BR',
    label: 'Brazilian Portuguese',
    nativeName: 'Português Brasileiro'
  },
  {
    code: 'fr',
    label: 'French',
    nativeName: 'Français'
  }
  // Add more languages here as needed
  // Example:
  // {
  //   code: 'es',
  //   label: 'Spanish',
  //   nativeName: 'Español'
  // }
];

/**
 * Valid language codes as a union type for type safety
 * This is automatically generated from SUPPORTED_LANGUAGES
 */
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Get the default language code
 */
export function getDefaultLanguage(): LanguageCode {
  const defaultLang = SUPPORTED_LANGUAGES.find(lang => lang.isDefault);
  return (defaultLang?.code || 'en') as LanguageCode;
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get language definition by code
 */
export function getLanguageByCode(code: string): LanguageDefinition | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get language label by code
 */
export function getLanguageLabel(code: string): string {
  return getLanguageByCode(code)?.label || code;
}

/**
 * Get language native name by code
 */
export function getLanguageNativeName(code: string): string {
  return getLanguageByCode(code)?.nativeName || code;
}