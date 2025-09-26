# Internationalization (i18n) Guide

This guide explains how to add new language translations to the Well-Architected IaC Analyzer application. The application uses a centralized approach to manage language configurations, making it straightforward to add support for new languages.

## Table of Contents
- [Internationalization (i18n) Guide](#internationalization-i18n-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [File Structure](#file-structure)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [Adding a New Language](#adding-a-new-language)
    - [Step 1: Update Frontend Language Configuration](#step-1-update-frontend-language-configuration)
    - [Step 2: Update Backend Language Configuration](#step-2-update-backend-language-configuration)
    - [Step 3: Add Language Translations](#step-3-add-language-translations)
    - [Step 4: Test Your Changes](#step-4-test-your-changes)
    - [Step 5: Create a Pull Request](#step-5-create-a-pull-request)
  - [Translation Best Practices](#translation-best-practices)
  - [Common Issues](#common-issues)
    - [Missing Translations](#missing-translations)
    - [Character Set Issues](#character-set-issues)
    - [RTL Language Support](#rtl-language-support)

## Overview

The Well-Architected IaC Analyzer supports multiple languages using a centralized configuration system. Language-related code is contained within dedicated configuration files in both the frontend and backend, making it easy to add new languages without modifying numerous files throughout the application.

Currently, the application supports:
- English (en) - Default
- Japanese (ja)
- Spanish (es)
- Brazilian Portuguese (pt-BR)
- French (fr)

## File Structure

The internationalization system consists of these key files:

### Frontend
1. **`languages.ts`**: Contains language definitions and utility functions
   - `SUPPORTED_LANGUAGES` array defines all available languages
   - Helper functions to work with language codes

2. **`strings.ts`**: Contains all translatable strings organized by categories
   - Defines the `I18nStrings` interface that all translations must implement
   - Contains an `i18nStrings` object with translations for each supported language

3. **`LanguageContext.tsx`**: Provides language settings throughout the component tree

### Backend
1. **`languages.ts`**: Contains language definitions for backend processing
   - Mirrors the frontend language configuration
   - Provides utility functions for language name lookups

## Adding a New Language

### Step 1: Update Frontend Language Configuration

First, add your language to the `SUPPORTED_LANGUAGES` array in `ecs_fargate_app/frontend/src/i18n/languages.ts`:

```typescript
export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    code: 'en',
    label: 'English',     // Display name in English
    nativeName: 'English',  // Name in the language itself
    isDefault: true
  },
  {
    code: 'ja',
    label: 'Japanese',
    nativeName: '日本語'
  },
  // Add your new language here. For example, if adding Spanish:
  {
    code: 'es',           // ISO language code
    label: 'Spanish',     // Display name in English
    nativeName: 'Español' // Name in the language itself
  }
];
```

### Step 2: Update Backend Language Configuration

Next, add your language to the `SUPPORTED_LANGUAGES` array in `ecs_fargate_app/backend/src/prompts/languages.ts`:

```typescript
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
  // Add your new language here. For example, if adding Spanish:
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español'
  }
];
```

### Step 3: Add Language Translations

Add your translations to the `i18nStrings` object in `ecs_fargate_app/frontend/src/i18n/strings.ts`:

1. Examine the `I18nStrings` interface to understand all required strings
2. Copy an existing language's translations as a starting point
3. Add your new language entry to the `i18nStrings` object
4. Translate all strings for your language

Example:

```typescript
export const i18nStrings: Record<Language, I18nStrings> = {
  en: {
    // Existing English translations...
  },
  ja: {
    // Existing Japanese translations...
  },
  // Add your new language here. For example, if adding Spanish:
  es: {
    common: {
      loading: "Cargando",
      error: "Error",
      cancel: "Cancelar",
      // ... rest of translations
    },
    app: {
      title: "Analizador de Infrastructure as Code (IaC)",
      subtitle: "Revise su infraestructura como código según las mejores prácticas de AWS Well-Architected Framework",
      // ... more translations
    },
    // ... rest of categories
  }
};
```

### Step 4: Test Your Changes

1. Build and run the application locally:

```bash
cd well-architected-iac-analyzer
npm run dev:up     # or npm run dev:up:finch depending on your container tool
```

2. Test the language selector and verify your translations display correctly throughout the app.
3. Test backend functionality like analysis, template generation, and detailed analysis with the new language.
4. Ensure all features work correctly with your new language.
5. Check for any missing translations or formatting issues.

### Step 5: Create a Pull Request

1. Commit your changes to a new branch:

```bash
git checkout -b add-language-xyz
git add ecs_fargate_app/frontend/src/i18n/languages.ts
git add ecs_fargate_app/frontend/src/i18n/strings.ts
git add ecs_fargate_app/backend/src/prompts/languages.ts
git commit -m "Add [Language Name] translations"
```

2. Push your branch to your fork:

```bash
git push origin add-language-xyz
```

3. Create a pull request to the main repository at https://github.com/aws-samples/well-architected-iac-analyzer

Your PR should include:
- Brief description of the new language support
- Any notes about translation decisions or challenges
- Confirmation that you've tested the changes locally

## Translation Best Practices

1. **Maintain Formatting**: Preserve any placeholders like `{variable}` or HTML/markdown syntax
2. **Respect Technical Terms**: Keep AWS service names and technical terms consistent
3. **Consider Context**: Be aware of where the string is used in the UI
4. **Maintain Consistency**: Use consistent terminology throughout the translations
5. **Length Awareness**: Be mindful of string lengths, especially for UI elements with space constraints

## Common Issues

### Missing Translations
If you notice that some text doesn't get translated, it might be:
- Missing from the translation object
- Referenced incorrectly in the code
- Using a dynamic value that needs special handling

### Character Set Issues
For languages with non-Latin characters, ensure proper encoding in all files.

### RTL Language Support
For right-to-left languages (like Arabic or Hebrew), additional UI adjustments might be needed beyond just string translations. Please open an issue to discuss RTL support if needed.

---

Thank you for contributing to the Well-Architected IaC Analyzer's language support! If you have questions or need assistance, please open an issue on the GitHub repository.
