import React from 'react';
import { Button, ButtonDropdown } from '@cloudscape-design/components';
import { useLanguage } from '../../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, strings } = useLanguage();

  const languageOptions = [
    {
      id: 'en',
      text: strings.language.english,
      description: 'English',
    },
    {
      id: 'ja',
      text: strings.language.japanese,
      description: '日本語',
    },
  ];

  const currentLanguageOption = languageOptions.find(option => option.id === language);

  return (
    <ButtonDropdown
      items={languageOptions}
      variant="icon"
      ariaLabel={language === 'ja' ? '言語を選択' : 'Select language'}
      onItemClick={({ detail }) => {
        if (detail.id === 'en' || detail.id === 'ja') {
          setLanguage(detail.id);
        }
      }}
    >
      {currentLanguageOption?.description || 'EN'}
    </ButtonDropdown>
  );
};

// Alternative simple button version for compact spaces
export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  return (
    <Button
      variant="inline-icon"
      iconName="globe"
      onClick={toggleLanguage}
      ariaLabel={language === 'ja' ? '言語を切り替え (English)' : 'Switch language (日本語)'}
    >
      {language === 'en' ? 'JP' : 'EN'}
    </Button>
  );
};
