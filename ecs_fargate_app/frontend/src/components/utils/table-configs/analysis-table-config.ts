import { Language, i18nStrings } from '../../../i18n/strings';

export const getTableFilteringProperties = (language: Language) => {
  const strings = i18nStrings[language];
  return [
    {
      propertyLabel: strings.analysisResults.pillar,
      key: 'pillar',
      groupValuesLabel: strings.propertyFilter.groupValuesLabel.pillar,
      operators: [':', '!:', '=', '!=', '^'],
    },
    {
      propertyLabel: strings.analysisResults.question,
      key: 'question',
      groupValuesLabel: strings.propertyFilter.groupValuesLabel.question,
      operators: [':', '!:', '=', '!=', '^'],
    },
    {
      propertyLabel: strings.analysisResults.bestPractice,
      key: 'name',
      groupValuesLabel: strings.propertyFilter.groupValuesLabel.bestPractice,
      operators: [':', '!:', '=', '!=', '^'],
    },
    {
      propertyLabel: `Is ${strings.analysisResults.bestPractice} Relevant?`,
      key: 'relevant',
      groupValuesLabel: strings.propertyFilter.groupValuesLabel.relevance,
      operators: ['=', '!='],
    },
    {
      propertyLabel: `Is ${strings.analysisResults.bestPractice} Applied?`,
      key: 'applied',
      groupValuesLabel: strings.propertyFilter.groupValuesLabel.status,
      operators: ['=', '!='],
    },
  ];
};

export const getPaginationLabels = (language: Language) => {
  const strings = i18nStrings[language];
  return {
    nextPageLabel: strings.pagination.nextPageLabel,
    previousPageLabel: strings.pagination.previousPageLabel,
    pageLabel: strings.pagination.pageLabel,
  };
};

export const getMatchesCountTextI18n = (count: number, language: Language) => {
  const strings = i18nStrings[language];
  return count === 1 ? `1 ${strings.common.match}` : `${count} ${strings.common.matches}`;
};

export const getPropertyFilterI18nStrings = (language: Language) => {
  const strings = i18nStrings[language];
  return {
    filteringAriaLabel: strings.propertyFilter.filteringAriaLabel,
    filteringPlaceholder: strings.propertyFilter.filteringPlaceholder,
    clearFiltersText: strings.propertyFilter.clearFiltersText,
    cancelActionText: strings.propertyFilter.cancelActionText,
    applyActionText: strings.propertyFilter.applyActionText,
    operationAndText: strings.propertyFilter.operationAndText,
    operationOrText: strings.propertyFilter.operationOrText,
    operatorContainsText: strings.propertyFilter.operatorContainsText,
    operatorDoesNotContainText: strings.propertyFilter.operatorDoesNotContainText,
    operatorEqualsText: strings.propertyFilter.operatorEqualsText,
    operatorDoesNotEqualText: strings.propertyFilter.operatorDoesNotEqualText,
    operatorStartsWithText: strings.propertyFilter.operatorStartsWithText,
  };
};

// Legacy exports for backward compatibility
export const tableFilteringProperties = getTableFilteringProperties('en');

export const paginationLabels = getPaginationLabels('en');

export const getMatchesCountText = (count: number) => {
  return getMatchesCountTextI18n(count, 'en');
};

export const propertyFilterI18nStrings = getPropertyFilterI18nStrings('en');
