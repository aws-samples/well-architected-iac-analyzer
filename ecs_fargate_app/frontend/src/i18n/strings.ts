import { LanguageCode } from './languages';

export type Language = LanguageCode;

export interface I18nStrings {
  common: {
    loading: string;
    error: string;
    cancel: string;
    apply: string;
    clear: string;
    confirm: string;
    close: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    upload: string;
    download: string;
    generate: string;
    analyze: string;
    filter: string;
    search: string;
    settings: string;
    help: string;
    next: string;
    previous: string;
    page: string;
    of: string;
    match: string;
    matches: string;
    item: string;
    items: string;
    selected: string;
    notSelected: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    success: string;
    warning: string;
    info: string;
    and: string;
    or: string;
    copy: string;
    contentCopied: string;
    messageCopied: string;
    failedToCopy: string;
    detailedAnalysis: string;
    generatedIacDocument: string;
  };
  app: {
    title: string;
    subtitle: string;
    navigation: {
      sideNavigation: string;
      closeSideNavigation: string;
      openSideNavigation: string;
      helpPanel: string;
      closeHelpPanel: string;
      openHelpPanel: string;
      notifications: string;
    };
  };
  analysisResults: {
    title: string;
    getMoreDetails: string;
    generateIacDocument: string;
    cancelIacGeneration: string;
    downloadAnalysis: string;
    bestPracticesReviewed: string;
    bestPracticesApplied: string;
    bestPracticesNotApplied: string;
    bestPracticesNotRelevant: string;
    pillar: string;
    question: string;
    bestPractice: string;
    status: string;
    reason: string;
    recommendations: string;
    applied: string;
    notApplied: string;
    notRelevant: string;
    askAiForMoreRecommendations: string;
    preferences: string;
    pageSize: string;
    columnPreferences: string;
    noBestPracticesFound: string;
    noMatches: string;
    clearFilter: string;
  };
  fileUpload: {
    title: string;
    singleOrMultipleFiles: string;
    completeIacProject: string;
    pdfDocuments: string;
    singleOrMultipleFilesDescription: string;
    completeIacProjectDescription: string;
    pdfDocumentsDescription: string;
    chooseFiles: string;
    uploading: string;
    dropFilesToUpload: string;
    dropZipFileToUpload: string;
    dropPdfFilesToUpload: string;
    removeFile: string;
    filesUploadedSuccessfully: string;
    fileUploadedSuccessfully: string;
    errorUploadingFile: string;
    uploadMode: string;
  };
  wellArchitectedAnalyzer: {
    startReview: string;
    cancelReview: string;
    cancelling: string;
    optionalSettings: string;
    lensSelector: string;
    outputLanguage: string;
    supportingDocumentUpload: string;
    wellArchitectedTool: string;
    iacGeneration: string;
    networkInterrupted: string;
    loadResults: string;
    tokenLimitWarning: string;
    currentWorkItem: string;
    currentLens: string;
    currentLensResultsStatus: string;
    currentLensSupportingDocument: string;
    analysisResults: string;
    iacDocument: string;
    iacDocumentUpdated: string;
    analyzing: string;
    inProgress: string;
    completed: string;
    failed: string;
    notStarted: string;
    partial: string;
    supportingDocumentDescription: string;
    downloadOriginalFile: string;
    selectLens: string;
    iacGenerationOnlyForImages: string;
    analysisProgress: string;
    iacGenerationProgress: string;
    networkConnectionInterrupted: string;
    analysisLikelyCompleted: string;
    youCan: string;
    clickLoadResults: string;
    orExpandWorkItem: string;
    tokenLimitExceeded: string;
    considerBreakingProject: string;
    generationCancelled: string;
    partialVersionGenerated: string;
    partialAnalysisResults: string;
    analysisCancelledMessage: string;
    partialIacGeneration: string;
    tryGeneratingAgain: string;
    analysisLanguageNotice: string;
  };
  lensSelector: {
    selectLens: string;
    wellArchitectedFramework: string;
  };
  pillarSelector: {
    selectPillars: string;
    operationalExcellence: string;
    security: string;
    reliability: string;
    performanceEfficiency: string;
    costOptimization: string;
    sustainability: string;
  };
  iacTemplateSelector: {
    selectTemplate: string;
    cloudFormation: string;
    terraform: string;
  };
  supportingDocumentUpload: {
    title: string;
    description: string;
  };
  propertyFilter: {
    filteringAriaLabel: string;
    filteringPlaceholder: string;
    clearFiltersText: string;
    cancelActionText: string;
    applyActionText: string;
    operationAndText: string;
    operationOrText: string;
    operatorContainsText: string;
    operatorDoesNotContainText: string;
    operatorEqualsText: string;
    operatorDoesNotEqualText: string;
    operatorStartsWithText: string;
    groupValuesLabel: {
      pillar: string;
      question: string;
      bestPractice: string;
      relevance: string;
      status: string;
    };
  };
  pagination: {
    nextPageLabel: string;
    previousPageLabel: string;
    pageLabel: (pageNumber: number) => string;
  };
  chat: {
    generatingResponse: string;
    analyzerAssistant: string;
    you: string;
    removeFile: (index: number) => string;
    showFewerFiles: string;
    showMoreFiles: string;
    errorIconAriaLabel: string;
    warningIconAriaLabel: string;
    loadingConversation: string;
    askAboutYourResults: string;
  };
  language: {
    title: string;
    select: string;
    switchTo: string; // Generic "Switch to {language}" format string
  };
  settings: {
    title: string;
    language: string;
    selectLanguage: string;
  };
  descriptions: {
    lensSelector: string;
    workloadIdInput: string;
    workloadIdInputDefaultLabel: string;
    workloadIdInputDefaultDescription: string;
    workloadIdInputNoWorkloadFound: string;
  };
  leftPanel: {
    myWorkItems: string;
    lenses: string;
    loadResults: string;
    downloadOriginalFile: string;
    chatHistory: string;
    deleteWorkItem: string;
    reloadWorkItems: string;
    deleteWorkItemModal: {
      title: string;
      message: string;
      warning: string;
      cancel: string;
      delete: string;
      status: string;
    },
    deleteChatHistoryModal: {
      title: string;
      message: string;
      warning: string;
      cancel: string;
      delete: string;
    }
  };
  helpContent: {
    default: {
      header: string;
      description: string;
      keyFeaturesTitle: string;
      iacAnalysis: string;
      architectureReview: string;
      analyzerAssistant: string;
      waIntegration: string;
      aiPoweredAnalysis: string;
      howToUseTitle: string;
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      step5: string;
      step6: string;
      needHelpTitle: string;
      needHelpDescription: string;
      additionalResourcesTitle: string;
      waFrameworkDocLink: string;
      waToolGettingStartedLink: string;
    };
    fileUpload: {
      header: string;
      description: string;
      iacFormats: string;
      imageFormats: string;
      documentFormats: string;
      maxSize: string;
      uploadOptions: string;
    };
    pillarSelection: {
      header: string;
      description: string;
      operationalExcellence: string;
      security: string;
      reliability: string;
      performanceEfficiency: string;
      costOptimization: string;
      sustainability: string;
      learnMoreLink: string;
    };
    analysisResults: {
      header: string;
      description: string;
      viewBestPractices: string;
      statusIndicatorsTitle: string;
      appliedGreen: string;
      notAppliedRed: string;
      notRelevantGrey: string;
      getMoreDetails: string;
      generateIacDocument: string;
      downloadAnalysis: string;
    };
    wellArchitectedTool: {
      header: string;
      description: string;
      viewRiskSummary: string;
      trackRisks: string;
      generateReports: string;
      workloadManagementTitle: string;
      completeReviewTitle: string;
      completeReviewWithId: string;
      completeReviewWithoutId: string;
      deleteWorkloadTitle: string;
      deleteWorkloadOnlyCreated: string;
      deleteWorkloadNotExisting: string;
      deleteWorkloadCleanup: string;
      securityNote: string;
      learnMoreLink: string;
    };
    iacDocument: {
      header: string;
      description: string;
      reviewTemplates: string;
      copyToClipboard: string;
      downloadAsFile: string;
      templatesNote: string;
    };
    workloadId: {
      header: string;
      description: string;
      optionalCreate: string;
      selectExisting: string;
      foundInConsole: string;
      learnMoreLink: string;
    };
    iacTypeSelection: {
      header: string;
      description: string;
      cloudFormation: string;
      terraform: string;
      awsCdkTitle: string;
      typescript: string;
      python: string;
      go: string;
      java: string;
      csharp: string;
      availabilityNote: string;
    };
    supportingDocument: {
      header: string;
      description: string;
      supportedFormatsTitle: string;
      supportedFormats: string;
      maxSizeTitle: string;
      maxSize: string;
      descriptionTitle: string;
      descriptionText: string;
      usageNote: string;
      singleDocNote: string;
    };
    lensSelection: {
      header: string;
      description: string;
      waFrameworkTitle: string;
      waFrameworkDescription: string;
      specializedLensesTitle: string;
      specializedLensesDescription: string;
      serverlessLens: string;
      iotLens: string;
      saasLens: string;
      otherLenses: string;
      lensExplanation: string;
      whySpecializedTitle: string;
      whySpecializedDescription: string;
    };
  };
  riskSummary: {
    title: string;
    workloadId: string;
    noWorkloadIdAssociated: string;
    questionsAnswered: string;
    highRisks: string;
    mediumRisks: string;
    pillar: string;
    progress: string;
    completeReview: string;
    generateReport: string;
    deleteWorkload: string;
    loadingRiskSummary: string;
    deleteWorkloadModal: {
      title: string;
      confirmMessage: string;
      cannotUndo: string;
      note: string;
      noteMessage: string;
    };
  };
}

export const i18nStrings: Record<Language, I18nStrings> = {

  en: {
    common: {
      loading: "Loading",
      error: "Error",
      cancel: "Cancel",
      apply: "Apply",
      clear: "Clear",
      confirm: "Confirm",
      close: "Close",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      remove: "Remove",
      upload: "Upload",
      download: "Download",
      generate: "Generate",
      analyze: "Analyze",
      filter: "Filter",
      search: "Search",
      settings: "Settings",
      help: "Help",
      next: "Next",
      previous: "Previous",
      page: "Page",
      of: "of",
      match: "match",
      matches: "matches",
      item: "item",
      items: "items",
      selected: "selected",
      notSelected: "not selected",
      all: "all",
      none: "none",
      yes: "Yes",
      no: "No",
      success: "Success",
      warning: "Warning",
      info: "Info",
      and: "and",
      or: "or",
      copy: "Copy",
      contentCopied: "Content copied",
      messageCopied: "Message copied",
      failedToCopy: "Failed to copy",
      detailedAnalysis: "Detailed Analysis",
      generatedIacDocument: "Generated IaC Document",
    },
    app: {
      title: "Infrastructure as Code (IaC) Analyzer",
      subtitle: "Review your infrastructure as code against AWS Well-Architected Framework Best Practices",
      navigation: {
        sideNavigation: "Side navigation",
        closeSideNavigation: "Close side navigation",
        openSideNavigation: "Open side navigation",
        helpPanel: "Help panel",
        closeHelpPanel: "Close help panel",
        openHelpPanel: "Open help panel",
        notifications: "Notifications",
      },
    },
    analysisResults: {
      title: "Analysis Results",
      getMoreDetails: "Get More Details",
      generateIacDocument: "Generate IaC Document",
      cancelIacGeneration: "Cancel IaC Generation",
      downloadAnalysis: "Download Analysis",
      bestPracticesReviewed: "Best Practices Reviewed",
      bestPracticesApplied: "Best Practices Applied",
      bestPracticesNotApplied: "Best Practices Not Applied",
      bestPracticesNotRelevant: "Best Practices Not Relevant",
      pillar: "Pillar",
      question: "Question",
      bestPractice: "Best Practice",
      status: "Status",
      reason: "Reason",
      recommendations: "Recommendations",
      applied: "Applied",
      notApplied: "Not Applied",
      notRelevant: "Not Relevant",
      askAiForMoreRecommendations: "Ask AI for more recommendations",
      preferences: "Preferences",
      pageSize: "Page size",
      columnPreferences: "Column preferences",
      noBestPracticesFound: "No best practices found",
      noMatches: "No matches",
      clearFilter: "Clear filter",
    },
    fileUpload: {
      title: "Upload your IaC documents, architecture diagram image, or PDF documents",
      singleOrMultipleFiles: "Single or Multiple Files",
      completeIacProject: "Complete IaC Project",
      pdfDocuments: "PDF Documents",
      singleOrMultipleFilesDescription: "Upload single or multiple related IaC documents. Or, upload a single architecture diagram image.",
      completeIacProjectDescription: "Upload a .zip file containing your IaC project or repository files. Binary and media files in the zip will be excluded.",
      pdfDocumentsDescription: "Upload up to 5 PDF documents (max 4.5MB each) with text, charts and visuals related to architectural documentation and technical specifications relevant to your workload.",
      chooseFiles: "Choose files",
      uploading: "Uploading...",
      dropFilesToUpload: "Drop file(s) to upload",
      dropZipFileToUpload: "Drop ZIP file to upload",
      dropPdfFilesToUpload: "Drop PDF file(s) to upload (max 5)",
      removeFile: "Remove",
      filesUploadedSuccessfully: "Files uploaded successfully",
      fileUploadedSuccessfully: "File uploaded successfully",
      errorUploadingFile: "Error uploading file",
      uploadMode: "Upload mode",
    },
    wellArchitectedAnalyzer: {
      startReview: "Start Review",
      cancelReview: "Cancel Review",
      cancelling: "Cancelling...",
      optionalSettings: "Optional Settings",
      lensSelector: "Lens Selector",
      outputLanguage: "Output Language",
      supportingDocumentUpload: "Supporting Document Upload",
      wellArchitectedTool: "Well-Architected Tool",
      iacGeneration: "IaC Generation",
      networkInterrupted: "Network Connection Interrupted",
      loadResults: "Load Results",
      tokenLimitWarning: "Token Limit Warning",
      currentWorkItem: "Current Work Item",
      currentLens: "Current Lens",
      currentLensResultsStatus: "Current Lens Results Status",
      currentLensSupportingDocument: "Current Lens Supporting Document",
      analysisResults: "Analysis Results",
      iacDocument: "IaC Document",
      iacDocumentUpdated: "IaC Document (Updated)",
      analyzing: "Analyzing uploaded file according to",
      inProgress: "In progress",
      completed: "Completed",
      failed: "Failed",
      notStarted: "Not Started",
      partial: "Partial results - Stopped at",
      supportingDocumentDescription: "Supporting Document Description",
      downloadOriginalFile: "Download original file",
      selectLens: "Select a lens",
      iacGenerationOnlyForImages: "IaC template generation is only available when analyzing architecture diagram images.",
      analysisProgress: "Analysis progress",
      iacGenerationProgress: "IaC document generation progress",
      networkConnectionInterrupted: "Network Connection Interrupted",
      analysisLikelyCompleted: "Your network connection was interrupted while the analysis was running. The analysis has likely completed in the background.",
      youCan: "You can:",
      clickLoadResults: "Click \"Load Results\" to try loading the most recent results",
      orExpandWorkItem: "Or expand your work item in the side navigation panel and click \"Load results\"",
      tokenLimitExceeded: "Your project contains approximately {count} tokens, which exceeds the recommended limit of 200,000 tokens.",
      considerBreakingProject: "The model invocation may fail or the analysis may lose context due to the large file size. Consider breaking your project into smaller pieces for better results.",
      generationCancelled: "Generation cancelled",
      partialVersionGenerated: "The IaC document generation was cancelled. A partial version has been generated and can be viewed in the 'IaC Document' tab. You can either use this partial version or try generating the complete document again.",
      partialAnalysisResults: "Partial Analysis Results",
      analysisCancelledMessage: "The analysis of the uploaded file was cancelled. Partial results are shown below. You can either use these partial results or try analyzing the complete file again.",
      partialIacGeneration: "Partial IaC Document Generation",
      tryGeneratingAgain: "You can try generating the complete document again after waiting a few minutes.",
      analysisLanguageNotice: "Analysis results will be generated in {language}. Best practice names will remain in English for consistency with AWS documentation.",
    },
    lensSelector: {
      selectLens: "Select Lens",
      wellArchitectedFramework: "Well-Architected Framework",
    },
    pillarSelector: {
      selectPillars: "Select Pillars",
      operationalExcellence: "Operational Excellence",
      security: "Security",
      reliability: "Reliability",
      performanceEfficiency: "Performance Efficiency",
      costOptimization: "Cost Optimization",
      sustainability: "Sustainability",
    },
    iacTemplateSelector: {
      selectTemplate: "Select IaC Template Type",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "Supporting Document Upload",
      description: "Upload additional documentation to provide context for the analysis",
    },
    propertyFilter: {
      filteringAriaLabel: "Filter best practices",
      filteringPlaceholder: "Filter best practices",
      clearFiltersText: "Clear filters",
      cancelActionText: "Cancel",
      applyActionText: "Apply",
      operationAndText: "and",
      operationOrText: "or",
      operatorContainsText: "Contains",
      operatorDoesNotContainText: "Does not contain",
      operatorEqualsText: "Equals",
      operatorDoesNotEqualText: "Does not equal",
      operatorStartsWithText: "Starts with",
      groupValuesLabel: {
        pillar: "Pillar values",
        question: "Question values",
        bestPractice: "Best Practice values",
        relevance: "Relevance values",
        status: "Status values",
      },
    },
    pagination: {
      nextPageLabel: "Next page",
      previousPageLabel: "Previous page",
      pageLabel: (pageNumber: number) => `Page ${pageNumber} of all pages`,
    },
    chat: {
      generatingResponse: "Generating a response...",
      analyzerAssistant: "Analyzer Assistant",
      you: "You",
      removeFile: (index: number) => `Remove file ${index + 1}`,
      showFewerFiles: "Show fewer files",
      showMoreFiles: "Show more files",
      errorIconAriaLabel: "Error",
      warningIconAriaLabel: "Warning",
      loadingConversation: "Loading conversation...",
      askAboutYourResults: "Ask about your results or best practices...",
    },
    language: {
      title: "Language",
      select: "Select language",
      switchTo: "Switch to {language}"
    },
    settings: {
      title: "Settings",
      language: "Language",
      selectLanguage: "Select language",
    },
    descriptions: {
      lensSelector: "Select which Well-Architected lens to use for reviewing your infrastructure",
      workloadIdInput: "Optionally enter an existing Well-Architected Tool workload ID, or leave empty to create a new one. (Note: Only those with name starting as \"IaCAnalyzer_\" will be retrieved)",
      workloadIdInputDefaultLabel: "Select a workload ID (optional)",
      workloadIdInputDefaultDescription: "Leave empty to create a new workload",
      workloadIdInputNoWorkloadFound: "No workloads found",
    },
    leftPanel: {
      myWorkItems: "My Work Items",
      lenses: "Lenses:",
      loadResults: "Load results:",
      downloadOriginalFile: "Download original file:",
      chatHistory: "Chat history:",
      deleteWorkItem: "Delete work item:",
      reloadWorkItems: "Reload Work Items",
      deleteWorkItemModal: {
        title: "Delete Work Item",
        message: "Are you sure you want to delete the work item? ",
        warning: "This action cannot be undone.",
        cancel: "Cancel",
        delete: "Delete",
        status: "Analysis Status:"
      },
      deleteChatHistoryModal: {
        title: "Delete Chat History",
        message: "Are you sure you want to delete the chat history? ",
        warning: "This action cannot be undone.",
        cancel: "Cancel", 
        delete: "Delete"
      }
    },
    helpContent: {
      default: {
        header: 'About Well-Architected IaC Analyzer',
        description: 'This tool helps you evaluate your infrastructure designs against AWS Well-Architected Framework best practices.',
        keyFeaturesTitle: 'Key Features',
        iacAnalysis: 'IaC Analysis: Upload CloudFormation (YAML/JSON), Terraform or AWS CDK templates for automated analysis',
        architectureReview: 'Architecture Review: Upload architecture diagrams (PNG/JPG) and get IaC recommendations',
        analyzerAssistant: 'Analyzer Assistant chatbot: Ask questions, seek clarification, and receive personalized guidance about analysis results',
        waIntegration: 'AWS Well-Architected Integration: Directly update your AWS Well-Architected Tool workload',
        aiPoweredAnalysis: 'AI-Powered Analysis: Get detailed recommendations using AWS Bedrock',
        howToUseTitle: 'How to Use',
        step1: 'Upload your IaC document(s) or architecture diagram',
        step2: 'Select the Well-Architected pillars to review. You can also select different lenses to be used for the analysis',
        step3: 'Optionally upload a supporting document to provide additional context for better analysis',
        step4: 'Optionally provide a Well-Architected Tool workload ID',
        step5: 'Review the analysis results and recommendations',
        step6: 'Update your Well-Architected Tool workload or generate IaC templates',
        needHelpTitle: 'Need Help?',
        needHelpDescription: 'Look for the help icons throughout the application for detailed information about specific features.',
        additionalResourcesTitle: 'Additional Resources',
        waFrameworkDocLink: 'AWS Well-Architected Framework Documentation',
        waToolGettingStartedLink: 'Getting Started with AWS Well-Architected Tool',
      },
      fileUpload: {
        header: 'File Upload',
        description: 'Upload your Infrastructure as Code (IaC) documents, architecture diagram, or PDF documents for analysis:',
        iacFormats: 'Supported IaC formats: YAML, JSON (CloudFormation), Terraform (.tf), and AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: 'Supported image formats: PNG, JPG, JPEG (max 3.75MB per image, dimensions not exceeding 8000×8000 pixels)',
        documentFormats: 'Supported document formats: PDF (up to 5 documents, max 4.5MB each)',
        maxSize: 'For IaC files and ZIP projects: maximum size 100MB',
        uploadOptions: 'You can upload a single IaC file, multiple related files, a complete project (ZIP), or architectural documentation as PDFs. When uploading an architecture diagram, you can later generate IaC templates based on the analysis.',
      },
      pillarSelection: {
        header: 'Well-Architected Pillars',
        description: 'Select which Well-Architected Framework pillars to include in your analysis:',
        operationalExcellence: 'Operational Excellence: Operations as code, observability, etc.',
        security: 'Security: Identity management, data protection, incident response',
        reliability: 'Reliability: Recovery planning, adapting to changes, etc.',
        performanceEfficiency: 'Performance Efficiency: Resource optimization, monitoring',
        costOptimization: 'Cost Optimization: Cost-effective resources, expenditure awareness',
        sustainability: 'Sustainability: Environmental impact reduction strategies',
        learnMoreLink: 'Learn more about Well-Architected pillars',
      },
      analysisResults: {
        header: 'Analysis Results',
        description: 'Review the analysis of your infrastructure against Well-Architected best practices:',
        viewBestPractices: 'View applied, not applied, and not relevant best practices. Use the table filters and preferences to customize your view.',
        statusIndicatorsTitle: 'Status Indicators:',
        appliedGreen: 'Applied (Green): Best practice is implemented in your infrastructure',
        notAppliedRed: 'Not Applied (Red): Best practice is relevant but not implemented',
        notRelevantGrey: 'Not Relevant (Grey): Best practice is not applicable to your infrastructure',
        getMoreDetails: 'Get More Details: Get in-depth analysis and recommendations for selected best practices',
        generateIacDocument: 'Generate IaC Document: Convert architecture diagrams into infrastructure code (Available only for image uploads)',
        downloadAnalysis: 'Download Analysis: Export all findings and recommendations as a CSV file',
      },
      wellArchitectedTool: {
        header: 'Well-Architected Tool Integration',
        description: 'Track and manage your workload\'s alignment with AWS Well-Architected Framework:',
        viewRiskSummary: 'View risk summary across all pillars',
        trackRisks: 'Track high and medium risks',
        generateReports: 'Generate Well-Architected Tool reports',
        workloadManagementTitle: 'Important: Workload Management',
        completeReviewTitle: 'Complete Well-Architected Tool Review:',
        completeReviewWithId: 'If you provided an existing Workload ID in Optional Settings: Updates will be made to that workload',
        completeReviewWithoutId: 'If no Workload ID was provided: A new workload will be created automatically',
        deleteWorkloadTitle: 'Delete Well-Architected Tool Workload:',
        deleteWorkloadOnlyCreated: 'Only available for workloads created by this tool',
        deleteWorkloadNotExisting: 'Not available for existing workloads (where you provided the Workload ID)',
        deleteWorkloadCleanup: 'Use this to clean up temporary workloads created during your analysis',
        securityNote: 'Note: For security reasons, this tool cannot delete Well-Architected workloads that were not created by it. If you provided your own Workload ID, you\'ll need to manage that workload directly in the AWS Console.',
        learnMoreLink: 'Learn more about managing Well-Architected workloads',
      },
      iacDocument: {
        header: 'IaC Document',
        description: 'View and manage generated Infrastructure as Code documents:',
        reviewTemplates: 'Review generated IaC templates',
        copyToClipboard: 'Copy content to clipboard',
        downloadAsFile: 'Download as file',
        templatesNote: 'Templates are generated following AWS best practices and Well-Architected recommendations.',
      },
      workloadId: {
        header: 'Well-Architected Workload ID',
        description: 'The Workload ID connects your analysis with AWS Well-Architected Tool:',
        optionalCreate: 'Optional: Don\'t select any specific workload to create a new one',
        selectExisting: 'Select an existing ID to update an existing workload',
        foundInConsole: 'Workloads are found in AWS Well-Architected Tool console',
        learnMoreLink: 'Learn more about Well-Architected workloads',
      },
      iacTypeSelection: {
        header: 'IaC Template Type Selection',
        description: 'Choose the type of Infrastructure as Code template to generate:',
        cloudFormation: 'CloudFormation YAML/JSON: Generate AWS CloudFormation templates',
        terraform: 'Terraform: Generate HashiCorp Terraform configuration files',
        awsCdkTitle: 'AWS CDK: Generate AWS Cloud Development Kit code in your preferred programming language:',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: 'This option is only available when analyzing architecture diagrams.',
      },
      supportingDocument: {
        header: 'Supporting Document Upload',
        description: 'Enhance your analysis by uploading a supporting document that provides additional context:',
        supportedFormatsTitle: 'Supported Formats:',
        supportedFormats: 'PDF documents (.pdf), Plain text files (.txt), Images (.png, .jpg, .jpeg)',
        maxSizeTitle: 'Maximum Size:',
        maxSize: '4.5MB',
        descriptionTitle: 'Description:',
        descriptionText: 'A brief description of the document is required to help the analyzer understand its content',
        usageNote: 'The supporting document will be used alongside your IaC template or architecture diagram to provide more context during analysis, potentially resulting in more accurate recommendations.',
        singleDocNote: 'Note: Only one supporting document (the most recently uploaded) will be used for the analysis.',
      },
      lensSelection: {
        header: 'Well-Architected Lens Selection',
        description: 'Select which AWS Well-Architected lens to use for analyzing your infrastructure:',
        waFrameworkTitle: 'Well-Architected Framework:',
        waFrameworkDescription: 'The standard Well-Architected Framework with six pillars (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability)',
        specializedLensesTitle: 'Specialized Lenses:',
        specializedLensesDescription: 'Additional lenses focusing on specific technologies or domains, such as:',
        serverlessLens: 'Serverless Lens - For serverless application architectures',
        iotLens: 'IoT Lens - For Internet of Things workloads',
        saasLens: 'SaaS Lens - For Software-as-a-Service architectures',
        otherLenses: 'And other specialized industry and technology lenses',
        lensExplanation: 'Each lens provides tailored best practices and recommendations specific to that domain or technology. The pillars available for review will change based on your selected lens.',
        whySpecializedTitle: 'Why use specialized lenses?',
        whySpecializedDescription: 'Specialized lenses provide more targeted guidance for specific workload types. For example, the Serverless Lens includes best practices specifically relevant to serverless architecture that may not be covered in the standard Well-Architected Framework.',
      },
    },
    riskSummary: {
      title: 'Risk Summary',
      workloadId: 'Workload ID',
      noWorkloadIdAssociated: 'No Workload ID associated',
      questionsAnswered: 'Questions Answered',
      highRisks: 'High Risks',
      mediumRisks: 'Medium Risks',
      pillar: 'Pillar',
      progress: 'Progress',
      completeReview: 'Complete Well-Architected Tool Review',
      generateReport: 'Generate Well-Architected Tool Report',
      deleteWorkload: 'Delete Well-Architected Tool Workload',
      loadingRiskSummary: 'Loading risk summary data...',
      deleteWorkloadModal: {
        title: 'Delete Well-Architected Tool Workload',
        confirmMessage: 'Are you sure you want to delete the workload with ID',
        cannotUndo: 'This action cannot be undone.',
        note: 'Note:',
        noteMessage: 'This will only delete the workload in the AWS Well-Architected Tool. Your analysis results and recommendations in this application will remain available.',
      },
    },
  },
  ja: {
    common: {
      loading: "読み込み中",
      error: "エラー",
      cancel: "キャンセル",
      apply: "適用",
      clear: "クリア",
      confirm: "確認",
      close: "閉じる",
      save: "保存",
      delete: "削除",
      edit: "編集",
      add: "追加",
      remove: "削除",
      upload: "アップロード",
      download: "ダウンロード",
      generate: "生成",
      analyze: "分析",
      filter: "フィルター",
      search: "検索",
      settings: "設定",
      help: "ヘルプ",
      next: "次へ",
      previous: "前へ",
      page: "ページ",
      of: "の",
      match: "件",
      matches: "件",
      item: "項目",
      items: "項目",
      selected: "選択済み",
      notSelected: "未選択",
      all: "すべて",
      none: "なし",
      yes: "はい",
      no: "いいえ",
      success: "成功",
      warning: "警告",
      info: "情報",
      and: "かつ",
      or: "または",
      copy: "コピー",
      contentCopied: "コンテンツをコピーしました",
      messageCopied: "メッセージをコピーしました",
      failedToCopy: "コピーに失敗しました",
      detailedAnalysis: "詳細分析",
      generatedIacDocument: "生成された IaC ドキュメント",
    },
    app: {
      title: "Infrastructure as Code (IaC) アナライザー",
      subtitle: "AWS Well-Architected フレームワークのベストプラクティスに対してインフラストラクチャコードを確認",
      navigation: {
        sideNavigation: "サイドナビゲーション",
        closeSideNavigation: "サイドナビゲーションを閉じる",
        openSideNavigation: "サイドナビゲーションを開く",
        helpPanel: "ヘルプパネル",
        closeHelpPanel: "ヘルプパネルを閉じる",
        openHelpPanel: "ヘルプパネルを開く",
        notifications: "通知",
      },
    },
    analysisResults: {
      title: "分析結果",
      getMoreDetails: "詳細を取得",
      generateIacDocument: "IaC ドキュメントを生成",
      cancelIacGeneration: "IaC 生成をキャンセル",
      downloadAnalysis: "分析をダウンロード",
      bestPracticesReviewed: "確認済みベストプラクティス",
      bestPracticesApplied: "適用済みベストプラクティス",
      bestPracticesNotApplied: "未適用ベストプラクティス",
      bestPracticesNotRelevant: "関連性なしベストプラクティス",
      pillar: "柱",
      question: "質問",
      bestPractice: "ベストプラクティス",
      status: "ステータス",
      reason: "理由",
      recommendations: "推奨事項",
      applied: "適用済み",
      notApplied: "未適用",
      notRelevant: "関連性なし",
      askAiForMoreRecommendations: "AIに詳細な推奨事項を尋ねる",
      preferences: "設定",
      pageSize: "ページサイズ",
      columnPreferences: "列の設定",
      noBestPracticesFound: "ベストプラクティスが見つかりません",
      noMatches: "一致する項目がありません",
      clearFilter: "フィルターをクリア",
    },
    fileUpload: {
      title: "IaC ドキュメント、アーキテクチャ図、または PDF ドキュメントをアップロード",
      singleOrMultipleFiles: "単一または複数ファイル",
      completeIacProject: "完全な IaC プロジェクト",
      pdfDocuments: "PDF ドキュメント",
      singleOrMultipleFilesDescription: "単一または複数の関連する IaC ドキュメントをアップロードします。または、単一のアーキテクチャ図をアップロードします。",
      completeIacProjectDescription: "IaC プロジェクトまたはリポジトリファイルを含む .zip ファイルをアップロードします。zip 内のバイナリファイルとメディアファイルは除外されます。",
      pdfDocumentsDescription: "ワークロードに関連するアーキテクチャドキュメントや技術仕様に関するテキスト、チャート、ビジュアルを含むPDFドキュメントを最大5つ（各4.5MBまで）アップロードできます。",
      chooseFiles: "ファイルを選択",
      uploading: "アップロード中...",
      dropFilesToUpload: "ファイルをドロップしてアップロード",
      dropZipFileToUpload: "ZIP ファイルをドロップしてアップロード",
      dropPdfFilesToUpload: "PDF ファイルをドロップしてアップロード（最大 5 つ）",
      removeFile: "削除",
      filesUploadedSuccessfully: "ファイルのアップロードが完了しました",
      fileUploadedSuccessfully: "ファイルのアップロードが完了しました",
      errorUploadingFile: "ファイルのアップロードエラー",
      uploadMode: "アップロードモード",
    },
    wellArchitectedAnalyzer: {
      startReview: "レビューを開始",
      cancelReview: "レビューをキャンセル",
      cancelling: "キャンセル中...",
      optionalSettings: "オプション設定",
      lensSelector: "レンズセレクター",
      outputLanguage: "出力言語",
      supportingDocumentUpload: "サポートドキュメントアップロード",
      wellArchitectedTool: "Well-Architected Tool",
      iacGeneration: "IaC 生成",
      networkInterrupted: "ネットワーク接続が中断されました",
      loadResults: "結果を読み込み",
      tokenLimitWarning: "トークン制限警告",
      currentWorkItem: "現在の作業項目",
      currentLens: "現在のレンズ",
      currentLensResultsStatus: "現在のレンズ結果ステータス",
      currentLensSupportingDocument: "現在のレンズサポートドキュメント",
      analysisResults: "分析結果",
      iacDocument: "IaC ドキュメント",
      iacDocumentUpdated: "IaC ドキュメント（更新済み）",
      analyzing: "アップロードされたファイルを分析中",
      inProgress: "進行中",
      completed: "完了",
      failed: "失敗",
      notStarted: "未開始",
      partial: "部分的な結果 - 停止位置",
      supportingDocumentDescription: "サポートドキュメントの説明",
      downloadOriginalFile: "元のファイルをダウンロード",
      selectLens: "レンズを選択",
      iacGenerationOnlyForImages: "IaC テンプレート生成は、アーキテクチャ図の分析時のみ利用可能です。",
      analysisProgress: "分析進行状況",
      iacGenerationProgress: "IaC ドキュメント生成進行状況",
      networkConnectionInterrupted: "ネットワーク接続が中断されました",
      analysisLikelyCompleted: "分析の実行中にネットワーク接続が中断されました。分析はバックグラウンドで完了している可能性があります。",
      youCan: "以下の操作が可能です：",
      clickLoadResults: "「結果を読み込み」をクリックして最新の結果を読み込む",
      orExpandWorkItem: "またはサイドナビゲーションパネルで作業項目を展開して「結果を読み込み」をクリック",
      tokenLimitExceeded: "プロジェクトには約 {count} トークンが含まれており、推奨制限の 200,000 トークンを超えています。",
      considerBreakingProject: "ファイルサイズが大きいため、モデル呼び出しが失敗したり、分析でコンテキストが失われる可能性があります。より良い結果を得るために、プロジェクトを小さな部分に分割することを検討してください。",
      generationCancelled: "生成がキャンセルされました",
      partialVersionGenerated: "IaC ドキュメントの生成がキャンセルされました。部分的なバージョンが生成され、「IaC ドキュメント」タブで確認できます。この部分的なバージョンを使用するか、完全なドキュメントを再度生成することができます。",
      partialAnalysisResults: "部分的な分析結果",
      analysisCancelledMessage: "アップロードされたファイルの分析がキャンセルされました。以下に部分的な結果が表示されています。これらの部分的な結果を使用するか、完全なファイルを再度分析してください。",
      partialIacGeneration: "部分的な IaC ドキュメント生成",
      tryGeneratingAgain: "数分待ってから完全なドキュメントの生成を再試行できます。",
      analysisLanguageNotice: "分析結果は日本語で生成されます。ベストプラクティス名はAWSドキュメントとの整合性のため英語のままとなります。",
    },
    lensSelector: {
      selectLens: "レンズを選択",
      wellArchitectedFramework: "Well-Architected フレームワーク",
    },
    pillarSelector: {
      selectPillars: "柱を選択",
      operationalExcellence: "運用上の優秀性",
      security: "セキュリティ",
      reliability: "信頼性",
      performanceEfficiency: "パフォーマンス効率",
      costOptimization: "コスト最適化",
      sustainability: "持続可能性",
    },
    iacTemplateSelector: {
      selectTemplate: "IaC テンプレートタイプを選択",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "サポートドキュメントアップロード",
      description: "分析にコンテキストを提供するための追加ドキュメントをアップロード",
    },
    propertyFilter: {
      filteringAriaLabel: "ベストプラクティスをフィルター",
      filteringPlaceholder: "ベストプラクティスをフィルター",
      clearFiltersText: "フィルターをクリア",
      cancelActionText: "キャンセル",
      applyActionText: "適用",
      operationAndText: "かつ",
      operationOrText: "または",
      operatorContainsText: "含む",
      operatorDoesNotContainText: "含まない",
      operatorEqualsText: "等しい",
      operatorDoesNotEqualText: "等しくない",
      operatorStartsWithText: "で始まる",
      groupValuesLabel: {
        pillar: "柱の値",
        question: "質問の値",
        bestPractice: "ベストプラクティスの値",
        relevance: "関連性の値",
        status: "ステータスの値",
      },
    },
    pagination: {
      nextPageLabel: "次のページ",
      previousPageLabel: "前のページ",
      pageLabel: (pageNumber: number) => `全ページ中 ${pageNumber} ページ目`,
    },
    chat: {
      generatingResponse: "応答を生成中...",
      analyzerAssistant: "アナライザーアシスタント",
      you: "あなた",
      removeFile: (index: number) => `ファイル ${index + 1} を削除`,
      showFewerFiles: "ファイルを少なく表示",
      showMoreFiles: "ファイルをもっと表示",
      errorIconAriaLabel: "エラー",
      warningIconAriaLabel: "警告",
      loadingConversation: "会話を読み込み中...",
      askAboutYourResults: "結果やベストプラクティスについて質問する...",
    },
    language: {
      title: "言語",
      select: "言語を選択",
      switchTo: "{language}に切り替え"
    },
    settings: {
      title: "設定",
      language: "言語",
      selectLanguage: "言語を選択",
    },
    descriptions: {
      lensSelector: "インフラストラクチャのレビューに使用するWell-Architectedレンズを選択してください",
      workloadIdInput: "既存のWell-Architected Toolワークロード IDを入力するか、空のままにして新しいものを作成してください。（注：「IaCAnalyzer_」で始まる名前のものだけが取得されます）",
      workloadIdInputDefaultLabel: "ワークロードIDを選択（任意）",
      workloadIdInputDefaultDescription: "空白のままにして新しいワークロードを作成",
      workloadIdInputNoWorkloadFound: "ワークロードが見つかりません",
    },
    leftPanel: {
      myWorkItems: "マイワークアイテム",
      lenses: "レンズ：",
      loadResults: "結果を読み込み：",
      downloadOriginalFile: "元のファイルをダウンロード：",
      chatHistory: "チャット履歴：",
      deleteWorkItem: "ワークアイテムを削除：",
      reloadWorkItems: "ワークアイテムを再読み込み",
      deleteWorkItemModal: {
        title: "ワークアイテムを削除",
        message: "ワークアイテムを削除してもよろしいですか？",
        warning: "この操作は元に戻せません。",
        cancel: "キャンセル",
        delete: "削除",
        status: "分析ステータス："
      },
      deleteChatHistoryModal: {
        title: "チャット履歴を削除",
        message: "チャット履歴を削除してもよろしいですか？",
        warning: "この操作は元に戻せません。",
        cancel: "キャンセル",
        delete: "削除"
      },
    },
    helpContent: {
      default: {
        header: 'Well-Architected IaC アナライザーについて',
        description: 'このツールは、AWS Well-Architected フレームワークのベストプラクティスに対してインフラストラクチャ設計を評価するのに役立ちます。',
        keyFeaturesTitle: '主な機能',
        iacAnalysis: 'IaC 分析: CloudFormation (YAML/JSON)、Terraform、または AWS CDK テンプレートをアップロードして自動分析',
        architectureReview: 'アーキテクチャレビュー: アーキテクチャ図 (PNG/JPG) をアップロードして IaC の推奨事項を取得',
        analyzerAssistant: 'アナライザーアシスタントチャットボット: 質問をしたり、説明を求めたり、分析結果に関するパーソナライズされたガイダンスを受け取る',
        waIntegration: 'AWS Well-Architected 統合: AWS Well-Architected Tool のワークロードを直接更新',
        aiPoweredAnalysis: 'AI を活用した分析: AWS Bedrock を使用して詳細な推奨事項を取得',
        howToUseTitle: '使用方法',
        step1: 'IaC ドキュメントまたはアーキテクチャ図をアップロード',
        step2: 'レビューする Well-Architected の柱を選択。分析に使用する異なるレンズを選択することもできます',
        step3: 'オプションで、より良い分析のために追加のコンテキストを提供するサポートドキュメントをアップロード',
        step4: 'オプションで、Well-Architected Tool のワークロード ID を提供',
        step5: '分析結果と推奨事項を確認',
        step6: 'Well-Architected Tool のワークロードを更新するか、IaC テンプレートを生成',
        needHelpTitle: 'ヘルプが必要ですか？',
        needHelpDescription: '特定の機能に関する詳細情報については、アプリケーション全体のヘルプアイコンを探してください。',
        additionalResourcesTitle: '追加リソース',
        waFrameworkDocLink: 'AWS Well-Architected フレームワークドキュメント',
        waToolGettingStartedLink: 'AWS Well-Architected Tool の開始方法',
      },
      fileUpload: {
        header: 'ファイルアップロード',
        description: '分析のために Infrastructure as Code (IaC) ドキュメント、アーキテクチャ図、または PDF ドキュメントをアップロードしてください：',
        iacFormats: 'サポートされている IaC 形式: YAML、JSON (CloudFormation)、Terraform (.tf)、AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: 'サポートされている画像形式: PNG、JPG、JPEG (画像あたり最大 3.75MB、8000×8000 ピクセルを超えない寸法)',
        documentFormats: 'サポートされているドキュメント形式: PDF (最大 5 ドキュメント、各最大 4.5MB)',
        maxSize: 'IaC ファイルと ZIP プロジェクトの場合: 最大サイズ 100MB',
        uploadOptions: '単一の IaC ファイル、複数の関連ファイル、完全なプロジェクト (ZIP)、または PDF としてのアーキテクチャドキュメントをアップロードできます。アーキテクチャ図をアップロードすると、後で分析に基づいて IaC テンプレートを生成できます。',
      },
      pillarSelection: {
        header: 'Well-Architected の柱',
        description: '分析に含める Well-Architected フレームワークの柱を選択してください：',
        operationalExcellence: '運用上の優秀性: コードとしての運用、可観測性など',
        security: 'セキュリティ: ID 管理、データ保護、インシデント対応',
        reliability: '信頼性: 復旧計画、変化への適応など',
        performanceEfficiency: 'パフォーマンス効率: リソースの最適化、モニタリング',
        costOptimization: 'コスト最適化: 費用対効果の高いリソース、支出の認識',
        sustainability: '持続可能性: 環境への影響削減戦略',
        learnMoreLink: 'Well-Architected の柱についての詳細',
      },
      analysisResults: {
        header: '分析結果',
        description: 'Well-Architected のベストプラクティスに対するインフラストラクチャの分析を確認してください：',
        viewBestPractices: '適用済み、未適用、および関連性なしのベストプラクティスを表示します。テーブルのフィルターと設定を使用して表示をカスタマイズできます。',
        statusIndicatorsTitle: 'ステータスインジケーター:',
        appliedGreen: '適用済み (緑): ベストプラクティスがインフラストラクチャに実装されています',
        notAppliedRed: '未適用 (赤): ベストプラクティスは関連性がありますが実装されていません',
        notRelevantGrey: '関連性なし (グレー): ベストプラクティスはインフラストラクチャに適用されません',
        getMoreDetails: '詳細を取得: 選択したベストプラクティスの詳細な分析と推奨事項を取得',
        generateIacDocument: 'IaC ドキュメントを生成: アーキテクチャ図をインフラストラクチャコードに変換 (画像アップロードのみで利用可能)',
        downloadAnalysis: '分析をダウンロード: すべての調査結果と推奨事項を CSV ファイルとしてエクスポート',
      },
      wellArchitectedTool: {
        header: 'Well-Architected Tool との統合',
        description: 'AWS Well-Architected フレームワークとのワークロードの整合性を追跡および管理します：',
        viewRiskSummary: 'すべての柱にわたるリスク概要を表示',
        trackRisks: '高リスクと中リスクを追跡',
        generateReports: 'Well-Architected Tool レポートを生成',
        workloadManagementTitle: '重要: ワークロード管理',
        completeReviewTitle: 'Well-Architected Tool レビューを完了:',
        completeReviewWithId: 'オプション設定で既存のワークロード ID を提供した場合: そのワークロードに更新が行われます',
        completeReviewWithoutId: 'ワークロード ID が提供されていない場合: 新しいワークロードが自動的に作成されます',
        deleteWorkloadTitle: 'Well-Architected Tool ワークロードを削除:',
        deleteWorkloadOnlyCreated: 'このツールで作成されたワークロードのみ利用可能',
        deleteWorkloadNotExisting: '既存のワークロード (ワークロード ID を提供した場合) では利用できません',
        deleteWorkloadCleanup: '分析中に作成された一時的なワークロードをクリーンアップするために使用',
        securityNote: '注意: セキュリティ上の理由から、このツールは作成していない Well-Architected ワークロードを削除できません。独自のワークロード ID を提供した場合は、AWS コンソールで直接そのワークロードを管理する必要があります。',
        learnMoreLink: 'Well-Architected ワークロードの管理についての詳細',
      },
      iacDocument: {
        header: 'IaC ドキュメント',
        description: '生成された Infrastructure as Code ドキュメントを表示および管理します：',
        reviewTemplates: '生成された IaC テンプレートを確認',
        copyToClipboard: 'クリップボードにコピー',
        downloadAsFile: 'ファイルとしてダウンロード',
        templatesNote: 'テンプレートは AWS のベストプラクティスと Well-Architected の推奨事項に従って生成されます。',
      },
      workloadId: {
        header: 'Well-Architected ワークロード ID',
        description: 'ワークロード ID は、分析を AWS Well-Architected Tool に接続します：',
        optionalCreate: 'オプション: 新しいワークロードを作成するには特定のワークロードを選択しない',
        selectExisting: '既存のワークロードを更新するには既存の ID を選択',
        foundInConsole: 'ワークロードは AWS Well-Architected Tool コンソールで見つかります',
        learnMoreLink: 'Well-Architected ワークロードについての詳細',
      },
      iacTypeSelection: {
        header: 'IaC テンプレートタイプの選択',
        description: '生成する Infrastructure as Code テンプレートのタイプを選択してください：',
        cloudFormation: 'CloudFormation YAML/JSON: AWS CloudFormation テンプレートを生成',
        terraform: 'Terraform: HashiCorp Terraform 設定ファイルを生成',
        awsCdkTitle: 'AWS CDK: お好みのプログラミング言語で AWS Cloud Development Kit コードを生成:',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: 'このオプションは、アーキテクチャ図を分析する場合にのみ利用可能です。',
      },
      supportingDocument: {
        header: 'サポートドキュメントのアップロード',
        description: '追加のコンテキストを提供するサポートドキュメントをアップロードして分析を強化します：',
        supportedFormatsTitle: 'サポートされている形式:',
        supportedFormats: 'PDF ドキュメント (.pdf)、プレーンテキストファイル (.txt)、画像 (.png, .jpg, .jpeg)',
        maxSizeTitle: '最大サイズ:',
        maxSize: '4.5MB',
        descriptionTitle: '説明:',
        descriptionText: 'アナライザーがコンテンツを理解するのに役立つドキュメントの簡単な説明が必要です',
        usageNote: 'サポートドキュメントは、IaC テンプレートまたはアーキテクチャ図と一緒に使用され、分析中により多くのコンテキストを提供し、より正確な推奨事項につながる可能性があります。',
        singleDocNote: '注意: 分析には 1 つのサポートドキュメント (最後にアップロードされたもの) のみが使用されます。',
      },
      lensSelection: {
        header: 'Well-Architected レンズの選択',
        description: 'インフラストラクチャを分析するために使用する AWS Well-Architected レンズを選択してください：',
        waFrameworkTitle: 'Well-Architected フレームワーク:',
        waFrameworkDescription: '6 つの柱 (運用上の優秀性、セキュリティ、信頼性、パフォーマンス効率、コスト最適化、持続可能性) を持つ標準の Well-Architected フレームワーク',
        specializedLensesTitle: '専門レンズ:',
        specializedLensesDescription: '特定のテクノロジーまたはドメインに焦点を当てた追加のレンズ、例えば：',
        serverlessLens: 'サーバーレスレンズ - サーバーレスアプリケーションアーキテクチャ向け',
        iotLens: 'IoT レンズ - モノのインターネットワークロード向け',
        saasLens: 'SaaS レンズ - サービスとしてのソフトウェアアーキテクチャ向け',
        otherLenses: 'その他の専門的な業界およびテクノロジーレンズ',
        lensExplanation: '各レンズは、そのドメインまたはテクノロジーに特化したベストプラクティスと推奨事項を提供します。レビューに利用可能な柱は、選択したレンズに基づいて変わります。',
        whySpecializedTitle: 'なぜ専門レンズを使用するのか？',
        whySpecializedDescription: '専門レンズは、特定のワークロードタイプに対してより的を絞ったガイダンスを提供します。例えば、サーバーレスレンズには、標準の Well-Architected フレームワークでカバーされていない可能性のあるサーバーレスアーキテクチャに特に関連するベストプラクティスが含まれています。',
      },
    },
    riskSummary: {
      title: 'リスク概要',
      workloadId: 'ワークロード ID',
      noWorkloadIdAssociated: 'ワークロード ID が関連付けられていません',
      questionsAnswered: '回答済みの質問',
      highRisks: '高リスク',
      mediumRisks: '中リスク',
      pillar: '柱',
      progress: '進捗',
      completeReview: 'Well-Architected Tool レビューを完了',
      generateReport: 'Well-Architected Tool レポートを生成',
      deleteWorkload: 'Well-Architected Tool ワークロードを削除',
      loadingRiskSummary: 'リスク概要データを読み込み中...',
      deleteWorkloadModal: {
        title: 'Well-Architected Tool ワークロードを削除',
        confirmMessage: '次の ID のワークロードを削除してもよろしいですか',
        cannotUndo: 'この操作は元に戻せません。',
        note: '注意:',
        noteMessage: 'これは AWS Well-Architected Tool 内のワークロードのみを削除します。このアプリケーション内の分析結果と推奨事項は引き続き利用可能です。',
      },
    },
  },
  es: {
    common: {
      loading: "Cargando",
      error: "Error",
      cancel: "Cancelar",
      apply: "Aplicar",
      clear: "Limpiar",
      confirm: "Confirmar",
      close: "Cerrar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Agregar",
      remove: "Eliminar",
      upload: "Subir",
      download: "Descargar",
      generate: "Generar",
      analyze: "Analizar",
      filter: "Filtrar",
      search: "Buscar",
      settings: "Configuración",
      help: "Ayuda",
      next: "Siguiente",
      previous: "Anterior",
      page: "Página",
      of: "de",
      match: "coincidencia",
      matches: "coincidencias",
      item: "elemento",
      items: "elementos",
      selected: "seleccionado",
      notSelected: "no seleccionado",
      all: "todo",
      none: "ninguno",
      yes: "Sí",
      no: "No",
      success: "Éxito",
      warning: "Advertencia",
      info: "Info",
      and: "y",
      or: "o",
      copy: "Copiar",
      contentCopied: "Contenido copiado",
      messageCopied: "Mensaje copiado",
      failedToCopy: "Error al copiar",
      detailedAnalysis: "Análisis detallado",
      generatedIacDocument: "Documento IaC generado",
    },
    app: {
      title: "Analizador de Infrastructure as Code (IaC)",
      subtitle: "Revise su infraestructura como código según las mejores prácticas de AWS Well-Architected Framework",
      navigation: {
        sideNavigation: "Navegación lateral",
        closeSideNavigation: "Cerrar navegación lateral",
        openSideNavigation: "Abrir navegación lateral",
        helpPanel: "Panel de ayuda",
        closeHelpPanel: "Cerrar panel de ayuda",
        openHelpPanel: "Abrir panel de ayuda",
        notifications: "Notificaciones",
      },
    },
    analysisResults: {
      title: "Resultados del análisis",
      getMoreDetails: "Obtener más detalles",
      generateIacDocument: "Generar documento IaC",
      cancelIacGeneration: "Cancelar generación IaC",
      downloadAnalysis: "Descargar análisis",
      bestPracticesReviewed: "Prácticas recomendadas revisadas",
      bestPracticesApplied: "Prácticas recomendadas aplicadas",
      bestPracticesNotApplied: "Prácticas recomendadas no aplicadas",
      bestPracticesNotRelevant: "Prácticas recomendadas no relevantes",
      pillar: "Pilar",
      question: "Pregunta",
      bestPractice: "Práctica recomendada",
      status: "Estado",
      reason: "Razón",
      recommendations: "Recomendaciones",
      applied: "Aplicado",
      notApplied: "No aplicado",
      notRelevant: "No relevante",
      askAiForMoreRecommendations: "Preguntar a IA por más recomendaciones",
      preferences: "Preferencias",
      pageSize: "Tamaño de página",
      columnPreferences: "Preferencias de columnas",
      noBestPracticesFound: "No se encontraron prácticas recomendadas",
      noMatches: "Sin coincidencias",
      clearFilter: "Limpiar filtro",
    },
    fileUpload: {
      title: "Suba sus documentos IaC, diagrama de arquitectura o documentos PDF",
      singleOrMultipleFiles: "Archivo único o múltiple",
      completeIacProject: "Proyecto IaC completo",
      pdfDocuments: "Documentos PDF",
      singleOrMultipleFilesDescription: "Suba un archivo IaC único o múltiples archivos relacionados. O, suba un diagrama de arquitectura.",
      completeIacProjectDescription: "Suba un archivo .zip que contenga su proyecto IaC o archivos de repositorio. Se excluirán archivos binarios y multimedia del zip.",
      pdfDocumentsDescription: "Suba hasta 5 documentos PDF (máximo 4.5MB cada uno) con texto, gráficos y elementos visuales relacionados con la documentación arquitectónica y especificaciones técnicas relevantes para tu carga de trabajo.",
      chooseFiles: "Elegir archivos",
      uploading: "Subiendo...",
      dropFilesToUpload: "Suelte archivo(s) para subir",
      dropZipFileToUpload: "Suelte archivo ZIP para subir",
      dropPdfFilesToUpload: "Suelte archivo(s) PDF para subir (máx. 5)",
      removeFile: "Eliminar",
      filesUploadedSuccessfully: "Archivos subidos exitosamente",
      fileUploadedSuccessfully: "Archivo subido exitosamente",
      errorUploadingFile: "Error al subir archivo",
      uploadMode: "Modo de carga",
    },
    wellArchitectedAnalyzer: {
      startReview: "Iniciar revisión",
      cancelReview: "Cancelar revisión",
      cancelling: "Cancelando...",
      optionalSettings: "Configuración opcional",
      lensSelector: "Selector de lente",
      outputLanguage: "Idioma de resultados",
      supportingDocumentUpload: "Cargar documento de soporte",
      wellArchitectedTool: "Well-Architected Tool",
      iacGeneration: "Generación IaC",
      networkInterrupted: "Conexión de red interrumpida",
      loadResults: "Cargar resultados",
      tokenLimitWarning: "Advertencia de límite de tokens",
      currentWorkItem: "Elemento de trabajo actual",
      currentLens: "Lente actual",
      currentLensResultsStatus: "Estado de resultados de lente actual",
      currentLensSupportingDocument: "Documento de soporte de lente actual",
      analysisResults: "Resultados de análisis",
      iacDocument: "Documento IaC",
      iacDocumentUpdated: "Documento IaC (Actualizado)",
      analyzing: "Analizando archivo subido según",
      inProgress: "En progreso",
      completed: "Completado",
      failed: "Fallido",
      notStarted: "No iniciado",
      partial: "Resultados parciales - Detenido en",
      supportingDocumentDescription: "Descripción del documento de soporte",
      downloadOriginalFile: "Descargar archivo original",
      selectLens: "Seleccionar una lente",
      iacGenerationOnlyForImages: "La generación de plantillas IaC solo está disponible al analizar diagramas de arquitectura.",
      analysisProgress: "Progreso del análisis",
      iacGenerationProgress: "Progreso de generación del documento IaC",
      networkConnectionInterrupted: "Conexión de red interrumpida",
      analysisLikelyCompleted: "Su conexión de red se interrumpió mientras el análisis estaba en ejecución. Es probable que el análisis haya terminado en segundo plano.",
      youCan: "Puede:",
      clickLoadResults: "Hacer clic en \"Cargar resultados\" para intentar cargar los resultados más recientes",
      orExpandWorkItem: "O expandir su elemento de trabajo en el panel de navegación lateral y hacer clic en \"Cargar resultados\"",
      tokenLimitExceeded: "Su proyecto contiene aproximadamente {count} tokens, lo que excede el límite recomendado de 200,000 tokens.",
      considerBreakingProject: "La invocación del modelo puede fallar o el análisis puede perder contexto debido al gran tamaño del archivo. Considere dividir su proyecto en partes más pequeñas para obtener mejores resultados.",
      generationCancelled: "Generación cancelada",
      partialVersionGenerated: "La generación del documento IaC fue cancelada. Se ha generado una versión parcial que se puede ver en la pestaña 'Documento IaC'. Puede usar esta versión parcial o intentar generar nuevamente el documento completo.",
      partialAnalysisResults: "Resultados de análisis parciales",
      analysisCancelledMessage: "El análisis del archivo cargado fue cancelado. Los resultados parciales se muestran a continuación. Puede usar estos resultados parciales o intentar analizar el archivo completo nuevamente.",
      partialIacGeneration: "Generación parcial de documento IaC",
      tryGeneratingAgain: "Puede intentar generar el documento completo nuevamente después de esperar unos minutos.",
      analysisLanguageNotice: "Los resultados del análisis se generarán en español. Los nombres de las prácticas recomendadas se mantendrán en inglés para mantener coherencia con la documentación de AWS.",
    },
    lensSelector: {
      selectLens: "Seleccionar lente",
      wellArchitectedFramework: "Well-Architected Framework",
    },
    pillarSelector: {
      selectPillars: "Seleccionar pilares",
      operationalExcellence: "Excelencia operativa",
      security: "Seguridad",
      reliability: "Fiabilidad",
      performanceEfficiency: "Eficiencia del rendimiento",
      costOptimization: "Optimización de costos",
      sustainability: "Sostenibilidad",
    },
    iacTemplateSelector: {
      selectTemplate: "Seleccionar tipo de plantilla IaC",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "Cargar documento de soporte",
      description: "Cargar documentación adicional para proporcionar contexto al análisis",
    },
    propertyFilter: {
      filteringAriaLabel: "Filtrar prácticas recomendadas",
      filteringPlaceholder: "Filtrar prácticas recomendadas",
      clearFiltersText: "Limpiar filtros",
      cancelActionText: "Cancelar",
      applyActionText: "Aplicar",
      operationAndText: "y",
      operationOrText: "o",
      operatorContainsText: "Contiene",
      operatorDoesNotContainText: "No contiene",
      operatorEqualsText: "Igual a",
      operatorDoesNotEqualText: "No igual a",
      operatorStartsWithText: "Comienza con",
      groupValuesLabel: {
        pillar: "Valores de pilar",
        question: "Valores de pregunta",
        bestPractice: "Valores de práctica recomendada",
        relevance: "Valores de relevancia",
        status: "Valores de estado",
      },
    },
    pagination: {
      nextPageLabel: "Página siguiente",
      previousPageLabel: "Página anterior",
      pageLabel: (pageNumber: number) => `Página ${pageNumber} de todas las páginas`,
    },
    chat: {
      generatingResponse: "Generando una respuesta...",
      analyzerAssistant: "Asistente de análisis",
      you: "Tú",
      removeFile: (index: number) => `Eliminar archivo ${index + 1}`,
      showFewerFiles: "Mostrar menos archivos",
      showMoreFiles: "Mostrar más archivos",
      errorIconAriaLabel: "Error",
      warningIconAriaLabel: "Advertencia",
      loadingConversation: "Cargando conversación...",
      askAboutYourResults: "Preguntar sobre sus resultados o mejores prácticas...",
    },
    language: {
      title: "Idioma",
      select: "Seleccionar idioma",
      switchTo: "Cambiar a {language}"
    },
    settings: {
      title: "Configuración",
      language: "Idioma",
      selectLanguage: "Seleccionar idioma",
    },
    descriptions: {
      lensSelector: "Seleccione qué lente de Well-Architected usar para revisar su infraestructura",
      workloadIdInput: "Opcionalmente, ingrese un ID de carga de trabajo existente de Well-Architected Tool, o deje en blanco para crear uno nuevo. (Nota: Solo se recuperarán aquellos con nombre que comience con \"IaCAnalyzer_\")",
      workloadIdInputDefaultLabel: "Seleccione un ID de carga de trabajo (opcional)",
      workloadIdInputDefaultDescription: "Deje vacío para crear una nueva carga de trabajo",
      workloadIdInputNoWorkloadFound: "No se encontraron cargas de trabajo",
    },
    leftPanel: {
      myWorkItems: "Mis Elementos de Trabajo",
      lenses: "Lentes:",
      loadResults: "Cargar resultados:",
      downloadOriginalFile: "Descargar archivo original:",
      chatHistory: "Historial de chat:",
      deleteWorkItem: "Eliminar elemento de trabajo:",
      reloadWorkItems: "Recargar Elementos de Trabajo",
      deleteWorkItemModal: {
        title: "Eliminar elemento de trabajo",
        message: "¿Está seguro de que desea eliminar el elemento de trabajo?",
        warning: "Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar",
        status: "Estado de Análisis:"
      },
      deleteChatHistoryModal: {
        title: "Eliminar historial de chat",
        message: "¿Está seguro de que desea eliminar el historial de chat?",
        warning: "Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar"
      },
    },
    helpContent: {
      default: {
        header: 'Acerca del Analizador de IaC Well-Architected',
        description: 'Esta herramienta le ayuda a evaluar sus diseños de infraestructura según las mejores prácticas del AWS Well-Architected Framework.',
        keyFeaturesTitle: 'Características principales',
        iacAnalysis: 'Análisis de IaC: Cargue plantillas de CloudFormation (YAML/JSON), Terraform o AWS CDK para un análisis automatizado',
        architectureReview: 'Revisión de arquitectura: Cargue diagramas de arquitectura (PNG/JPG) y obtenga recomendaciones de IaC',
        analyzerAssistant: 'Chatbot Asistente del Analizador: Haga preguntas, solicite aclaraciones y reciba orientación personalizada sobre los resultados del análisis',
        waIntegration: 'Integración con AWS Well-Architected: Actualice directamente su carga de trabajo en AWS Well-Architected Tool',
        aiPoweredAnalysis: 'Análisis impulsado por IA: Obtenga recomendaciones detalladas usando AWS Bedrock',
        howToUseTitle: 'Cómo usar',
        step1: 'Cargue su(s) documento(s) IaC o diagrama de arquitectura',
        step2: 'Seleccione los pilares de Well-Architected a revisar. También puede seleccionar diferentes lentes para el análisis',
        step3: 'Opcionalmente cargue un documento de soporte para proporcionar contexto adicional para un mejor análisis',
        step4: 'Opcionalmente proporcione un ID de carga de trabajo de Well-Architected Tool',
        step5: 'Revise los resultados del análisis y las recomendaciones',
        step6: 'Actualice su carga de trabajo de Well-Architected Tool o genere plantillas IaC',
        needHelpTitle: '¿Necesita ayuda?',
        needHelpDescription: 'Busque los iconos de ayuda en toda la aplicación para obtener información detallada sobre características específicas.',
        additionalResourcesTitle: 'Recursos adicionales',
        waFrameworkDocLink: 'Documentación de AWS Well-Architected Framework',
        waToolGettingStartedLink: 'Comenzando con AWS Well-Architected Tool',
      },
      fileUpload: {
        header: 'Carga de archivos',
        description: 'Cargue sus documentos de Infraestructura como Código (IaC), diagrama de arquitectura o documentos PDF para análisis:',
        iacFormats: 'Formatos IaC soportados: YAML, JSON (CloudFormation), Terraform (.tf) y AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: 'Formatos de imagen soportados: PNG, JPG, JPEG (máx. 3.75MB por imagen, dimensiones que no excedan 8000×8000 píxeles)',
        documentFormats: 'Formatos de documento soportados: PDF (hasta 5 documentos, máx. 4.5MB cada uno)',
        maxSize: 'Para archivos IaC y proyectos ZIP: tamaño máximo 100MB',
        uploadOptions: 'Puede cargar un solo archivo IaC, múltiples archivos relacionados, un proyecto completo (ZIP) o documentación arquitectónica como PDFs. Al cargar un diagrama de arquitectura, puede generar posteriormente plantillas IaC basadas en el análisis.',
      },
      pillarSelection: {
        header: 'Pilares de Well-Architected',
        description: 'Seleccione qué pilares del Well-Architected Framework incluir en su análisis:',
        operationalExcellence: 'Excelencia operativa: Operaciones como código, observabilidad, etc.',
        security: 'Seguridad: Gestión de identidad, protección de datos, respuesta a incidentes',
        reliability: 'Fiabilidad: Planificación de recuperación, adaptación a cambios, etc.',
        performanceEfficiency: 'Eficiencia del rendimiento: Optimización de recursos, monitoreo',
        costOptimization: 'Optimización de costos: Recursos rentables, conciencia del gasto',
        sustainability: 'Sostenibilidad: Estrategias de reducción del impacto ambiental',
        learnMoreLink: 'Más información sobre los pilares de Well-Architected',
      },
      analysisResults: {
        header: 'Resultados del análisis',
        description: 'Revise el análisis de su infraestructura según las mejores prácticas de Well-Architected:',
        viewBestPractices: 'Vea las mejores prácticas aplicadas, no aplicadas y no relevantes. Use los filtros y preferencias de la tabla para personalizar su vista.',
        statusIndicatorsTitle: 'Indicadores de estado:',
        appliedGreen: 'Aplicado (Verde): La mejor práctica está implementada en su infraestructura',
        notAppliedRed: 'No aplicado (Rojo): La mejor práctica es relevante pero no está implementada',
        notRelevantGrey: 'No relevante (Gris): La mejor práctica no es aplicable a su infraestructura',
        getMoreDetails: 'Obtener más detalles: Obtenga análisis y recomendaciones en profundidad para las mejores prácticas seleccionadas',
        generateIacDocument: 'Generar documento IaC: Convierta diagramas de arquitectura en código de infraestructura (disponible solo para cargas de imágenes)',
        downloadAnalysis: 'Descargar análisis: Exporte todos los hallazgos y recomendaciones como archivo CSV',
      },
      wellArchitectedTool: {
        header: 'Integración con Well-Architected Tool',
        description: 'Rastree y gestione la alineación de su carga de trabajo con AWS Well-Architected Framework:',
        viewRiskSummary: 'Vea el resumen de riesgos en todos los pilares',
        trackRisks: 'Rastree riesgos altos y medios',
        generateReports: 'Genere informes de Well-Architected Tool',
        workloadManagementTitle: 'Importante: Gestión de cargas de trabajo',
        completeReviewTitle: 'Completar revisión de Well-Architected Tool:',
        completeReviewWithId: 'Si proporcionó un ID de carga de trabajo existente en Configuración opcional: Las actualizaciones se realizarán en esa carga de trabajo',
        completeReviewWithoutId: 'Si no se proporcionó un ID de carga de trabajo: Se creará automáticamente una nueva carga de trabajo',
        deleteWorkloadTitle: 'Eliminar carga de trabajo de Well-Architected Tool:',
        deleteWorkloadOnlyCreated: 'Solo disponible para cargas de trabajo creadas por esta herramienta',
        deleteWorkloadNotExisting: 'No disponible para cargas de trabajo existentes (donde proporcionó el ID de carga de trabajo)',
        deleteWorkloadCleanup: 'Use esto para limpiar cargas de trabajo temporales creadas durante su análisis',
        securityNote: 'Nota: Por razones de seguridad, esta herramienta no puede eliminar cargas de trabajo de Well-Architected que no fueron creadas por ella. Si proporcionó su propio ID de carga de trabajo, deberá gestionar esa carga de trabajo directamente en la consola de AWS.',
        learnMoreLink: 'Más información sobre la gestión de cargas de trabajo de Well-Architected',
      },
      iacDocument: {
        header: 'Documento IaC',
        description: 'Vea y gestione los documentos de Infraestructura como Código generados:',
        reviewTemplates: 'Revise las plantillas IaC generadas',
        copyToClipboard: 'Copie el contenido al portapapeles',
        downloadAsFile: 'Descargue como archivo',
        templatesNote: 'Las plantillas se generan siguiendo las mejores prácticas de AWS y las recomendaciones de Well-Architected.',
      },
      workloadId: {
        header: 'ID de carga de trabajo de Well-Architected',
        description: 'El ID de carga de trabajo conecta su análisis con AWS Well-Architected Tool:',
        optionalCreate: 'Opcional: No seleccione ninguna carga de trabajo específica para crear una nueva',
        selectExisting: 'Seleccione un ID existente para actualizar una carga de trabajo existente',
        foundInConsole: 'Las cargas de trabajo se encuentran en la consola de AWS Well-Architected Tool',
        learnMoreLink: 'Más información sobre cargas de trabajo de Well-Architected',
      },
      iacTypeSelection: {
        header: 'Selección de tipo de plantilla IaC',
        description: 'Elija el tipo de plantilla de Infraestructura como Código a generar:',
        cloudFormation: 'CloudFormation YAML/JSON: Generar plantillas de AWS CloudFormation',
        terraform: 'Terraform: Generar archivos de configuración de HashiCorp Terraform',
        awsCdkTitle: 'AWS CDK: Generar código de AWS Cloud Development Kit en su lenguaje de programación preferido:',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: 'Esta opción solo está disponible al analizar diagramas de arquitectura.',
      },
      supportingDocument: {
        header: 'Carga de documento de soporte',
        description: 'Mejore su análisis cargando un documento de soporte que proporcione contexto adicional:',
        supportedFormatsTitle: 'Formatos soportados:',
        supportedFormats: 'Documentos PDF (.pdf), archivos de texto plano (.txt), imágenes (.png, .jpg, .jpeg)',
        maxSizeTitle: 'Tamaño máximo:',
        maxSize: '4.5MB',
        descriptionTitle: 'Descripción:',
        descriptionText: 'Se requiere una breve descripción del documento para ayudar al analizador a comprender su contenido',
        usageNote: 'El documento de soporte se utilizará junto con su plantilla IaC o diagrama de arquitectura para proporcionar más contexto durante el análisis, lo que potencialmente resultará en recomendaciones más precisas.',
        singleDocNote: 'Nota: Solo se utilizará un documento de soporte (el más recientemente cargado) para el análisis.',
      },
      lensSelection: {
        header: 'Selección de lente de Well-Architected',
        description: 'Seleccione qué lente de AWS Well-Architected usar para analizar su infraestructura:',
        waFrameworkTitle: 'Well-Architected Framework:',
        waFrameworkDescription: 'El Well-Architected Framework estándar con seis pilares (Excelencia operativa, Seguridad, Fiabilidad, Eficiencia del rendimiento, Optimización de costos, Sostenibilidad)',
        specializedLensesTitle: 'Lentes especializadas:',
        specializedLensesDescription: 'Lentes adicionales enfocadas en tecnologías o dominios específicos, como:',
        serverlessLens: 'Lente Serverless - Para arquitecturas de aplicaciones sin servidor',
        iotLens: 'Lente IoT - Para cargas de trabajo de Internet de las Cosas',
        saasLens: 'Lente SaaS - Para arquitecturas de Software como Servicio',
        otherLenses: 'Y otras lentes especializadas de industria y tecnología',
        lensExplanation: 'Cada lente proporciona mejores prácticas y recomendaciones adaptadas específicamente a ese dominio o tecnología. Los pilares disponibles para revisión cambiarán según la lente seleccionada.',
        whySpecializedTitle: '¿Por qué usar lentes especializadas?',
        whySpecializedDescription: 'Las lentes especializadas proporcionan orientación más específica para tipos de carga de trabajo específicos. Por ejemplo, la Lente Serverless incluye mejores prácticas específicamente relevantes para la arquitectura sin servidor que pueden no estar cubiertas en el Well-Architected Framework estándar.',
      },
    },
    riskSummary: {
      title: 'Resumen de riesgos',
      workloadId: 'ID de carga de trabajo',
      noWorkloadIdAssociated: 'No hay ID de carga de trabajo asociado',
      questionsAnswered: 'Preguntas respondidas',
      highRisks: 'Riesgos altos',
      mediumRisks: 'Riesgos medios',
      pillar: 'Pilar',
      progress: 'Progreso',
      completeReview: 'Completar revisión de Well-Architected Tool',
      generateReport: 'Generar informe de Well-Architected Tool',
      deleteWorkload: 'Eliminar carga de trabajo de Well-Architected Tool',
      loadingRiskSummary: 'Cargando datos del resumen de riesgos...',
      deleteWorkloadModal: {
        title: 'Eliminar carga de trabajo de Well-Architected Tool',
        confirmMessage: '¿Está seguro de que desea eliminar la carga de trabajo con ID',
        cannotUndo: 'Esta acción no se puede deshacer.',
        note: 'Nota:',
        noteMessage: 'Esto solo eliminará la carga de trabajo en AWS Well-Architected Tool. Sus resultados de análisis y recomendaciones en esta aplicación permanecerán disponibles.',
      },
    },
  },
    pt_BR: {
    common: {
      loading: "Carregando",
      error: "Erro",
      cancel: "Cancelar",
      apply: "Aplicar",
      clear: "Limpar",
      confirm: "Confirmar",
      close: "Fechar",
      save: "Salvar",
      delete: "Excluir",
      edit: "Editar",
      add: "Adicionar",
      remove: "Remover",
      upload: "Enviar",
      download: "Baixar",
      generate: "Gerar",
      analyze: "Analisar",
      filter: "Filtrar",
      search: "Pesquisar",
      settings: "Configurações",
      help: "Ajuda",
      next: "Próximo",
      previous: "Anterior",
      page: "Página",
      of: "de",
      match: "correspondência",
      matches: "correspondências",
      item: "item",
      items: "itens",
      selected: "selecionado",
      notSelected: "não selecionado",
      all: "todos",
      none: "nenhum",
      yes: "Sim",
      no: "Não",
      success: "Sucesso",
      warning: "Aviso",
      info: "Informação",
      and: "e",
      or: "ou",
      copy: "Copiar",
      contentCopied: "Conteúdo copiado",
      messageCopied: "Mensagem copiada",
      failedToCopy: "Falha ao copiar",
      detailedAnalysis: "Análise Detalhada",
      generatedIacDocument: "Documento IaC Gerado",
    },
    app: {
      title: "Analisador de Infraestrutura como Código (IaC)",
      subtitle: "Revise sua infraestrutura como código de acordo com as Melhores Práticas do AWS Well-Architected Framework",
      navigation: {
        sideNavigation: "Navegação lateral",
        closeSideNavigation: "Fechar navegação lateral",
        openSideNavigation: "Abrir navegação lateral",
        helpPanel: "Painel de ajuda",
        closeHelpPanel: "Fechar painel de ajuda",
        openHelpPanel: "Abrir painel de ajuda",
        notifications: "Notificações",
      },
    },
    analysisResults: {
      title: "Resultados da Análise",
      getMoreDetails: "Obter Mais Detalhes",
      generateIacDocument: "Gerar Documento IaC",
      cancelIacGeneration: "Cancelar Geração de IaC",
      downloadAnalysis: "Baixar Análise",
      bestPracticesReviewed: "Melhores Práticas Revisadas",
      bestPracticesApplied: "Melhores Práticas Aplicadas",
      bestPracticesNotApplied: "Melhores Práticas Não Aplicadas",
      bestPracticesNotRelevant: "Melhores Práticas Não Relevantes",
      pillar: "Pilar",
      question: "Pergunta",
      bestPractice: "Melhor Prática",
      status: "Status",
      reason: "Motivo",
      recommendations: "Recomendações",
      applied: "Aplicado",
      notApplied: "Não Aplicado",
      notRelevant: "Não Relevante",
      askAiForMoreRecommendations: "Peça à IA mais recomendações",
      preferences: "Preferências",
      pageSize: "Tamanho da página",
      columnPreferences: "Preferências de coluna",
      noBestPracticesFound: "Nenhuma melhor prática encontrada",
      noMatches: "Sem correspondências",
      clearFilter: "Limpar filtro",
    },
    fileUpload: {
      title: "Envie seus documentos IaC, imagem de diagrama de arquitetura ou documentos PDF",
      singleOrMultipleFiles: "Arquivo Único ou Múltiplos",
      completeIacProject: "Projeto IaC Completo",
      pdfDocuments: "Documentos PDF",
      singleOrMultipleFilesDescription: "Envie um ou vários documentos IaC relacionados. Ou envie uma única imagem de diagrama de arquitetura.",
      completeIacProjectDescription: "Envie um arquivo .zip contendo seu projeto IaC ou arquivos de repositório. Arquivos binários e de mídia no zip serão excluídos.",
      pdfDocumentsDescription: "Envie até 5 documentos PDF (máximo de 4,5MB cada) com texto, gráficos e elementos visuais relacionados à documentação arquitetônica e especificações técnicas relevantes para sua carga de trabalho.",
      chooseFiles: "Escolher arquivos",
      uploading: "Enviando...",
      dropFilesToUpload: "Solte arquivo(s) para enviar",
      dropZipFileToUpload: "Solte arquivo ZIP para enviar",
      dropPdfFilesToUpload: "Solte arquivo(s) PDF para enviar (máx. 5)",
      removeFile: "Remover",
      filesUploadedSuccessfully: "Arquivos enviados com sucesso",
      fileUploadedSuccessfully: "Arquivo enviado com sucesso",
      errorUploadingFile: "Erro ao enviar arquivo",
      uploadMode: "Modo de envio",
    },
    wellArchitectedAnalyzer: {
      startReview: "Iniciar Revisão",
      cancelReview: "Cancelar Revisão",
      cancelling: "Cancelando...",
      optionalSettings: "Configurações Opcionais",
      lensSelector: "Seletor de Lente",
      outputLanguage: "Idioma de Saída",
      supportingDocumentUpload: "Envio de Documento de Suporte",
      wellArchitectedTool: "Well-Architected Tool",
      iacGeneration: "Geração de IaC",
      networkInterrupted: "Conexão de Rede Interrompida",
      loadResults: "Carregar Resultados",
      tokenLimitWarning: "Aviso de Limite de Tokens",
      currentWorkItem: "Item de Trabalho Atual",
      currentLens: "Lente Atual",
      currentLensResultsStatus: "Status dos Resultados da Lente Atual",
      currentLensSupportingDocument: "Documento de Suporte da Lente Atual",
      analysisResults: "Resultados da Análise",
      iacDocument: "Documento IaC",
      iacDocumentUpdated: "Documento IaC (Atualizado)",
      analyzing: "Analisando arquivo enviado de acordo com",
      inProgress: "Em andamento",
      completed: "Concluído",
      failed: "Falhou",
      notStarted: "Não Iniciado",
      partial: "Resultados parciais - Parou em",
      supportingDocumentDescription: "Descrição do Documento de Suporte",
      downloadOriginalFile: "Baixar arquivo original",
      selectLens: "Selecione uma lente",
      iacGenerationOnlyForImages: "A geração de modelo IaC está disponível apenas ao analisar imagens de diagrama de arquitetura.",
      analysisProgress: "Progresso da análise",
      iacGenerationProgress: "Progresso da geração do documento IaC",
      networkConnectionInterrupted: "Conexão de Rede Interrompida",
      analysisLikelyCompleted: "Sua conexão de rede foi interrompida enquanto a análise estava em execução. A análise provavelmente foi concluída em segundo plano.",
      youCan: "Você pode:",
      clickLoadResults: "Clique em \"Carregar Resultados\" para tentar carregar os resultados mais recentes",
      orExpandWorkItem: "Ou expanda seu item de trabalho no painel de navegação lateral e clique em \"Carregar resultados\"",
      tokenLimitExceeded: "Seu projeto contém aproximadamente {count} tokens, o que excede o limite recomendado de 200.000 tokens.",
      considerBreakingProject: "A invocação do modelo pode falhar ou a análise pode perder contexto devido ao tamanho grande do arquivo. Considere dividir seu projeto em partes menores para obter melhores resultados.",
      generationCancelled: "Geração cancelada",
      partialVersionGenerated: "A geração do documento IaC foi cancelada. Uma versão parcial foi gerada e pode ser visualizada na aba 'Documento IaC'. Você pode usar esta versão parcial ou tentar gerar o documento completo novamente.",
      partialAnalysisResults: "Resultados Parciais da Análise",
      analysisCancelledMessage: "A análise do arquivo enviado foi cancelada. Os resultados parciais são mostrados abaixo. Você pode usar esses resultados parciais ou tentar analisar o arquivo completo novamente.",
      partialIacGeneration: "Geração Parcial do Documento IaC",
      tryGeneratingAgain: "Você pode tentar gerar o documento completo novamente após esperar alguns minutos.",
      analysisLanguageNotice: "Os resultados da análise serão gerados em {language}. Os nomes das melhores práticas permanecerão em inglês para consistência com a documentação da AWS.",
    },
    lensSelector: {
      selectLens: "Selecionar Perspectiva",
      wellArchitectedFramework: "Framework Well-Architected",
    },
    pillarSelector: {
      selectPillars: "Selecionar Pilares",
      operationalExcellence: "Excelência Operacional",
      security: "Segurança",
      reliability: "Confiabilidade",
      performanceEfficiency: "Eficiência de Performance",
      costOptimization: "Otimização de Custos",
      sustainability: "Sustentabilidade",
    },
    iacTemplateSelector: {
      selectTemplate: "Selecionar Tipo de Modelo IaC",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "Envio de Documento de Suporte",
      description: "Envie documentação adicional para fornecer contexto para a análise",
    },
    propertyFilter: {
      filteringAriaLabel: "Filtrar melhores práticas",
      filteringPlaceholder: "Filtrar melhores práticas",
      clearFiltersText: "Limpar filtros",
      cancelActionText: "Cancelar",
      applyActionText: "Aplicar",
      operationAndText: "e",
      operationOrText: "ou",
      operatorContainsText: "Contém",
      operatorDoesNotContainText: "Não contém",
      operatorEqualsText: "Igual a",
      operatorDoesNotEqualText: "Diferente de",
      operatorStartsWithText: "Começa com",
      groupValuesLabel: {
        pillar: "Valores de pilar",
        question: "Valores de pergunta",
        bestPractice: "Valores de Melhor Prática",
        relevance: "Valores de relevância",
        status: "Valores de status",
      },
    },
    pagination: {
      nextPageLabel: "Próxima página",
      previousPageLabel: "Página anterior",
      pageLabel: (pageNumber: number) => `Página ${pageNumber} de todas as páginas`,
    },
    chat: {
      generatingResponse: "Gerando uma resposta...",
      analyzerAssistant: "Assistente de Análise",
      you: "Você",
      removeFile: (index: number) => `Remover arquivo ${index + 1}`,
      showFewerFiles: "Mostrar menos arquivos",
      showMoreFiles: "Mostrar mais arquivos",
      errorIconAriaLabel: "Erro",
      warningIconAriaLabel: "Aviso",
      loadingConversation: "Carregando conversa...",
      askAboutYourResults: "Pergunte sobre seus resultados ou melhores práticas...",
    },
    language: {
      title: "Idioma",
      select: "Selecionar idioma",
      switchTo: "Mudar para {language}"
    },
    settings: {
      title: "Configurações",
      language: "Idioma",
      selectLanguage: "Selecionar idioma",
    },
    descriptions: {
      lensSelector: "Selecione qual perspectiva Well-Architected usar para revisar sua infraestrutura",
      workloadIdInput: "Opcionalmente, insira um ID de carga de trabalho existente da Well-Architected Tool, ou deixe em branco para criar um novo. (Nota: Apenas aqueles com nome começando com \"IaCAnalyzer_\" serão recuperados)",
      workloadIdInputDefaultLabel: "Selecione um ID de workload (opcional)",
      workloadIdInputDefaultDescription: "Deixe em branco para criar um novo workload",
      workloadIdInputNoWorkloadFound: "Nenhum workload encontrado",
    },
    leftPanel: {
      myWorkItems: "Meus Itens de Trabalho",
      lenses: "Lentes:",
      loadResults: "Carregar resultados:",
      downloadOriginalFile: "Baixar arquivo original:",
      chatHistory: "Histórico de chat:",
      deleteWorkItem: "Excluir item de trabalho:",
      reloadWorkItems: "Recarregar Itens de Trabalho",
      deleteWorkItemModal: {
        title: "Excluir item de trabalho",
        message: "Tem certeza de que deseja excluir o item de trabalho?",
        warning: "Esta ação não pode ser desfeita.",
        cancel: "Cancelar",
        delete: "Excluir",
        status: "Status da Análise:"
      },
      deleteChatHistoryModal: {
        title: "Excluir histórico de chat",
        message: "Tem certeza de que deseja excluir o histórico de chat?",
        warning: "Esta ação não pode ser desfeita.",
        cancel: "Cancelar",
        delete: "Excluir"
      }
    },
    helpContent: {
      default: {
        header: 'Sobre o Analisador de IaC Well-Architected',
        description: 'Esta ferramenta ajuda você a avaliar seus projetos de infraestrutura de acordo com as melhores práticas do AWS Well-Architected Framework.',
        keyFeaturesTitle: 'Principais Recursos',
        iacAnalysis: 'Análise de IaC: Faça upload de templates CloudFormation (YAML/JSON), Terraform ou AWS CDK para análise automatizada',
        architectureReview: 'Revisão de Arquitetura: Faça upload de diagramas de arquitetura (PNG/JPG) e obtenha recomendações de IaC',
        analyzerAssistant: 'Chatbot Assistente do Analisador: Faça perguntas, solicite esclarecimentos e receba orientações personalizadas sobre os resultados da análise',
        waIntegration: 'Integração com AWS Well-Architected: Atualize diretamente sua carga de trabalho no AWS Well-Architected Tool',
        aiPoweredAnalysis: 'Análise com IA: Obtenha recomendações detalhadas usando AWS Bedrock',
        howToUseTitle: 'Como Usar',
        step1: 'Faça upload do(s) seu(s) documento(s) IaC ou diagrama de arquitetura',
        step2: 'Selecione os pilares do Well-Architected para revisar. Você também pode selecionar diferentes lentes para a análise',
        step3: 'Opcionalmente, faça upload de um documento de suporte para fornecer contexto adicional para uma melhor análise',
        step4: 'Opcionalmente, forneça um ID de carga de trabalho do Well-Architected Tool',
        step5: 'Revise os resultados da análise e as recomendações',
        step6: 'Atualize sua carga de trabalho do Well-Architected Tool ou gere templates IaC',
        needHelpTitle: 'Precisa de Ajuda?',
        needHelpDescription: 'Procure os ícones de ajuda em todo o aplicativo para obter informações detalhadas sobre recursos específicos.',
        additionalResourcesTitle: 'Recursos Adicionais',
        waFrameworkDocLink: 'Documentação do AWS Well-Architected Framework',
        waToolGettingStartedLink: 'Começando com o AWS Well-Architected Tool',
      },
      fileUpload: {
        header: 'Upload de Arquivos',
        description: 'Faça upload de seus documentos de Infraestrutura como Código (IaC), diagrama de arquitetura ou documentos PDF para análise:',
        iacFormats: 'Formatos IaC suportados: YAML, JSON (CloudFormation), Terraform (.tf) e AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: 'Formatos de imagem suportados: PNG, JPG, JPEG (máx. 3,75MB por imagem, dimensões não excedendo 8000×8000 pixels)',
        documentFormats: 'Formatos de documento suportados: PDF (até 5 documentos, máx. 4,5MB cada)',
        maxSize: 'Para arquivos IaC e projetos ZIP: tamanho máximo 100MB',
        uploadOptions: 'Você pode fazer upload de um único arquivo IaC, múltiplos arquivos relacionados, um projeto completo (ZIP) ou documentação arquitetônica como PDFs. Ao fazer upload de um diagrama de arquitetura, você pode posteriormente gerar templates IaC com base na análise.',
      },
      pillarSelection: {
        header: 'Pilares do Well-Architected',
        description: 'Selecione quais pilares do Well-Architected Framework incluir em sua análise:',
        operationalExcellence: 'Excelência Operacional: Operações como código, observabilidade, etc.',
        security: 'Segurança: Gerenciamento de identidade, proteção de dados, resposta a incidentes',
        reliability: 'Confiabilidade: Planejamento de recuperação, adaptação a mudanças, etc.',
        performanceEfficiency: 'Eficiência de Performance: Otimização de recursos, monitoramento',
        costOptimization: 'Otimização de Custos: Recursos econômicos, conscientização sobre gastos',
        sustainability: 'Sustentabilidade: Estratégias de redução do impacto ambiental',
        learnMoreLink: 'Saiba mais sobre os pilares do Well-Architected',
      },
      analysisResults: {
        header: 'Resultados da Análise',
        description: 'Revise a análise de sua infraestrutura de acordo com as melhores práticas do Well-Architected:',
        viewBestPractices: 'Visualize as melhores práticas aplicadas, não aplicadas e não relevantes. Use os filtros e preferências da tabela para personalizar sua visualização.',
        statusIndicatorsTitle: 'Indicadores de Status:',
        appliedGreen: 'Aplicado (Verde): A melhor prática está implementada em sua infraestrutura',
        notAppliedRed: 'Não Aplicado (Vermelho): A melhor prática é relevante, mas não está implementada',
        notRelevantGrey: 'Não Relevante (Cinza): A melhor prática não é aplicável à sua infraestrutura',
        getMoreDetails: 'Obter Mais Detalhes: Obtenha análises e recomendações aprofundadas para as melhores práticas selecionadas',
        generateIacDocument: 'Gerar Documento IaC: Converta diagramas de arquitetura em código de infraestrutura (disponível apenas para uploads de imagens)',
        downloadAnalysis: 'Baixar Análise: Exporte todas as descobertas e recomendações como arquivo CSV',
      },
      wellArchitectedTool: {
        header: 'Integração com o Well-Architected Tool',
        description: 'Acompanhe e gerencie o alinhamento de sua carga de trabalho com o AWS Well-Architected Framework:',
        viewRiskSummary: 'Visualize o resumo de riscos em todos os pilares',
        trackRisks: 'Acompanhe riscos altos e médios',
        generateReports: 'Gere relatórios do Well-Architected Tool',
        workloadManagementTitle: 'Importante: Gerenciamento de Cargas de Trabalho',
        completeReviewTitle: 'Concluir Revisão do Well-Architected Tool:',
        completeReviewWithId: 'Se você forneceu um ID de carga de trabalho existente em Configurações Opcionais: As atualizações serão feitas nessa carga de trabalho',
        completeReviewWithoutId: 'Se nenhum ID de carga de trabalho foi fornecido: Uma nova carga de trabalho será criada automaticamente',
        deleteWorkloadTitle: 'Excluir Carga de Trabalho do Well-Architected Tool:',
        deleteWorkloadOnlyCreated: 'Disponível apenas para cargas de trabalho criadas por esta ferramenta',
        deleteWorkloadNotExisting: 'Não disponível para cargas de trabalho existentes (onde você forneceu o ID da carga de trabalho)',
        deleteWorkloadCleanup: 'Use isso para limpar cargas de trabalho temporárias criadas durante sua análise',
        securityNote: 'Nota: Por razões de segurança, esta ferramenta não pode excluir cargas de trabalho do Well-Architected que não foram criadas por ela. Se você forneceu seu próprio ID de carga de trabalho, precisará gerenciar essa carga de trabalho diretamente no Console da AWS.',
        learnMoreLink: 'Saiba mais sobre o gerenciamento de cargas de trabalho do Well-Architected',
      },
      iacDocument: {
        header: 'Documento IaC',
        description: 'Visualize e gerencie documentos de Infraestrutura como Código gerados:',
        reviewTemplates: 'Revise os templates IaC gerados',
        copyToClipboard: 'Copie o conteúdo para a área de transferência',
        downloadAsFile: 'Baixe como arquivo',
        templatesNote: 'Os templates são gerados seguindo as melhores práticas da AWS e as recomendações do Well-Architected.',
      },
      workloadId: {
        header: 'ID de Carga de Trabalho do Well-Architected',
        description: 'O ID da carga de trabalho conecta sua análise ao AWS Well-Architected Tool:',
        optionalCreate: 'Opcional: Não selecione nenhuma carga de trabalho específica para criar uma nova',
        selectExisting: 'Selecione um ID existente para atualizar uma carga de trabalho existente',
        foundInConsole: 'As cargas de trabalho são encontradas no console do AWS Well-Architected Tool',
        learnMoreLink: 'Saiba mais sobre cargas de trabalho do Well-Architected',
      },
      iacTypeSelection: {
        header: 'Seleção do Tipo de Template IaC',
        description: 'Escolha o tipo de template de Infraestrutura como Código a ser gerado:',
        cloudFormation: 'CloudFormation YAML/JSON: Gerar templates do AWS CloudFormation',
        terraform: 'Terraform: Gerar arquivos de configuração do HashiCorp Terraform',
        awsCdkTitle: 'AWS CDK: Gerar código do AWS Cloud Development Kit na sua linguagem de programação preferida:',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: 'Esta opção está disponível apenas ao analisar diagramas de arquitetura.',
      },
      supportingDocument: {
        header: 'Upload de Documento de Suporte',
        description: 'Melhore sua análise fazendo upload de um documento de suporte que forneça contexto adicional:',
        supportedFormatsTitle: 'Formatos Suportados:',
        supportedFormats: 'Documentos PDF (.pdf), arquivos de texto simples (.txt), imagens (.png, .jpg, .jpeg)',
        maxSizeTitle: 'Tamanho Máximo:',
        maxSize: '4,5MB',
        descriptionTitle: 'Descrição:',
        descriptionText: 'Uma breve descrição do documento é necessária para ajudar o analisador a entender seu conteúdo',
        usageNote: 'O documento de suporte será usado junto com seu template IaC ou diagrama de arquitetura para fornecer mais contexto durante a análise, potencialmente resultando em recomendações mais precisas.',
        singleDocNote: 'Nota: Apenas um documento de suporte (o mais recentemente enviado) será usado para a análise.',
      },
      lensSelection: {
        header: 'Seleção de Lente do Well-Architected',
        description: 'Selecione qual lente do AWS Well-Architected usar para analisar sua infraestrutura:',
        waFrameworkTitle: 'Well-Architected Framework:',
        waFrameworkDescription: 'O Well-Architected Framework padrão com seis pilares (Excelência Operacional, Segurança, Confiabilidade, Eficiência de Performance, Otimização de Custos, Sustentabilidade)',
        specializedLensesTitle: 'Lentes Especializadas:',
        specializedLensesDescription: 'Lentes adicionais focadas em tecnologias ou domínios específicos, como:',
        serverlessLens: 'Lente Serverless - Para arquiteturas de aplicações sem servidor',
        iotLens: 'Lente IoT - Para cargas de trabalho de Internet das Coisas',
        saasLens: 'Lente SaaS - Para arquiteturas de Software como Serviço',
        otherLenses: 'E outras lentes especializadas de indústria e tecnologia',
        lensExplanation: 'Cada lente fornece melhores práticas e recomendações adaptadas especificamente para aquele domínio ou tecnologia. Os pilares disponíveis para revisão mudarão com base na lente selecionada.',
        whySpecializedTitle: 'Por que usar lentes especializadas?',
        whySpecializedDescription: 'Lentes especializadas fornecem orientação mais direcionada para tipos específicos de carga de trabalho. Por exemplo, a Lente Serverless inclui melhores práticas especificamente relevantes para arquitetura sem servidor que podem não estar cobertas no Well-Architected Framework padrão.',
      },
    },
    riskSummary: {
      title: 'Resumo de Riscos',
      workloadId: 'ID da Carga de Trabalho',
      noWorkloadIdAssociated: 'Nenhum ID de carga de trabalho associado',
      questionsAnswered: 'Perguntas Respondidas',
      highRisks: 'Riscos Altos',
      mediumRisks: 'Riscos Médios',
      pillar: 'Pilar',
      progress: 'Progresso',
      completeReview: 'Concluir Revisão do Well-Architected Tool',
      generateReport: 'Gerar Relatório do Well-Architected Tool',
      deleteWorkload: 'Excluir Carga de Trabalho do Well-Architected Tool',
      loadingRiskSummary: 'Carregando dados do resumo de riscos...',
      deleteWorkloadModal: {
        title: 'Excluir Carga de Trabalho do Well-Architected Tool',
        confirmMessage: 'Tem certeza de que deseja excluir a carga de trabalho com ID',
        cannotUndo: 'Esta ação não pode ser desfeita.',
        note: 'Nota:',
        noteMessage: 'Isso excluirá apenas a carga de trabalho no AWS Well-Architected Tool. Seus resultados de análise e recomendações neste aplicativo permanecerão disponíveis.',
      },
    },
  },
  fr: {
    common: {
      loading: "Chargement",
      error: "Erreur",
      cancel: "Annuler",
      apply: "Appliquer",
      clear: "Effacer",
      confirm: "Confirmer",
      close: "Fermer",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      add: "Ajouter",
      remove: "Retirer",
      upload: "Télécharger",
      download: "Télécharger",
      generate: "Générer",
      analyze: "Analyser",
      filter: "Filtrer",
      search: "Rechercher",
      settings: "Paramètres",
      help: "Aide",
      next: "Suivant",
      previous: "Précédent",
      page: "Page",
      of: "de",
      match: "correspondance",
      matches: "correspondances",
      item: "élément",
      items: "éléments",
      selected: "sélectionné",
      notSelected: "non sélectionné",
      all: "tout",
      none: "aucun",
      yes: "Oui",
      no: "Non",
      success: "Succès",
      warning: "Avertissement",
      info: "Info",
      and: "et",
      or: "ou",
      copy: "Copier",
      contentCopied: "Contenu copié",
      messageCopied: "Message copié",
      failedToCopy: "Échec de la copie",
      detailedAnalysis: "Analyse détaillée",
      generatedIacDocument: "Document IaC généré",
    },
    app: {
      title: "Analyseur Infrastructure as Code (IaC)",
      subtitle: "Examinez votre code d'infrastructure par rapport aux meilleures pratiques du AWS Well-Architected Framework",
      navigation: {
        sideNavigation: "Navigation",
        closeSideNavigation: "Fermer la navigation",
        openSideNavigation: "Ouvrir la navigation",
        helpPanel: "Panneau d'aide",
        closeHelpPanel: "Fermer le panneau d'aide",
        openHelpPanel: "Ouvrir le panneau d'aide",
        notifications: "Notifications",
      },
    },
    analysisResults: {
      title: "Résultats d'analyse",
      getMoreDetails: "Obtenir plus de détails",
      generateIacDocument: "Générer un document IaC",
      cancelIacGeneration: "Annuler la génération IaC",
      downloadAnalysis: "Télécharger l'analyse",
      bestPracticesReviewed: "Meilleures pratiques examinées",
      bestPracticesApplied: "Meilleures pratiques appliquées",
      bestPracticesNotApplied: "Meilleures pratiques non appliquées",
      bestPracticesNotRelevant: "Meilleures pratiques non pertinentes",
      pillar: "Pilier",
      question: "Question",
      bestPractice: "Meilleure pratique",
      status: "Statut",
      reason: "Raison",
      recommendations: "Recommandations",
      applied: "Appliqué",
      notApplied: "Non appliqué",
      notRelevant: "Non pertinent",
      askAiForMoreRecommendations: "Demander à l'IA plus de recommandations",
      preferences: "Préférences",
      pageSize: "Taille de page",
      columnPreferences: "Préférences de colonnes",
      noBestPracticesFound: "Aucune meilleure pratique trouvée",
      noMatches: "Aucune correspondance",
      clearFilter: "Effacer le filtre",
    },
    fileUpload: {
      title: "Téléchargez vos documents IaC, diagramme d'architecture ou documents PDF",
      singleOrMultipleFiles: "Fichier unique ou multiples",
      completeIacProject: "Projet IaC complet",
      pdfDocuments: "Documents PDF",
      singleOrMultipleFilesDescription: "Téléchargez un ou plusieurs documents IaC liés, ou téléchargez une seule image de diagramme d'architecture.",
      completeIacProjectDescription: "Téléchargez un fichier .zip contenant votre projet IaC ou les fichiers de dépôt. Les fichiers binaires et multimédias dans le zip seront exclus.",
      pdfDocumentsDescription: "Téléchargez jusqu'à 5 documents PDF (max 4,5 Mo chacun) avec du texte, des graphiques et des éléments visuels liés à la documentation architecturale et aux spécifications techniques pertinentes pour votre charge de travail.",
      chooseFiles: "Choisir les fichiers",
      uploading: "Téléchargement...",
      dropFilesToUpload: "Déposez le(s) fichier(s) pour télécharger",
      dropZipFileToUpload: "Déposez le fichier ZIP pour télécharger",
      dropPdfFilesToUpload: "Déposez les fichiers PDF pour télécharger (max 5)",
      removeFile: "Supprimer",
      filesUploadedSuccessfully: "Fichiers téléchargés avec succès",
      fileUploadedSuccessfully: "Fichier téléchargé avec succès",
      errorUploadingFile: "Erreur lors du téléchargement du fichier",
      uploadMode: "Mode de téléchargement",
    },
    wellArchitectedAnalyzer: {
      startReview: "Commencer l'examen",
      cancelReview: "Annuler l'examen",
      cancelling: "Annulation",
      optionalSettings: "Paramètres optionnels",
      lensSelector: "Sélecteur de lentille",
      outputLanguage: "Langue de sortie",
      supportingDocumentUpload: "Téléchargement de documents de support",
      wellArchitectedTool: "Outil Well-Architected",
      iacGeneration: "Génération IaC",
      networkInterrupted: "Réseau interrompu",
      loadResults: "Charger les résultats",
      tokenLimitWarning: "Avertissement de limite de jetons",
      currentWorkItem: "Élément de travail actuel",
      currentLens: "Lentille actuelle",
      currentLensResultsStatus: "Statut des résultats de la lentille actuelle",
      currentLensSupportingDocument: "Document de support de la lentille actuelle",
      analysisResults: "Résultats d'analyse",
      iacDocument: "Document IaC",
      iacDocumentUpdated: "Document IaC mis à jour",
      analyzing: "Analyse du fichier téléchargé selon",
      inProgress: "En cours",
      completed: "Terminé",
      failed: "Échoué",
      notStarted: "Non commencé",
      partial: "Résultats partiels - Arrêté à",
      supportingDocumentDescription: "Téléchargez des documents de support (PDF, TXT, PNG, JPEG) pour fournir un contexte supplémentaire pour une analyse plus précise.",
      downloadOriginalFile: "Télécharger le fichier original",
      selectLens: "Sélectionner une lentille",
      iacGenerationOnlyForImages: "La génération de modèles IaC n'est disponible que lors de l'analyse d'images de diagrammes d'architecture.",
      analysisProgress: "Progression de l'analyse",
      iacGenerationProgress: "Progression de la génération du document IaC",
      networkConnectionInterrupted: "Connexion réseau interrompue",
      analysisLikelyCompleted: "Votre connexion réseau a été interrompue pendant l'exécution de l'analyse. L'analyse s'est probablement terminée en arrière-plan.",
      youCan: "Vous pouvez :",
      clickLoadResults: "Cliquer sur \"Charger les résultats\" pour essayer de charger les résultats les plus récents",
      orExpandWorkItem: "Ou développez votre élément de travail dans le panneau de navigation latéral et cliquez sur \"Charger les résultats\"",
      tokenLimitExceeded: "Votre projet contient approximativement {count} jetons, ce qui dépasse la limite recommandée de 200 000 jetons.",
      considerBreakingProject: "L'invocation du modèle peut échouer ou l'analyse peut perdre le contexte en raison de la grande taille du fichier. Considérez diviser votre projet en parties plus petites pour de meilleurs résultats.",
      generationCancelled: "Génération annulée",
      partialVersionGenerated: "La génération du document IaC a été annulée. Une version partielle a été générée et peut être consultée dans l'onglet 'Document IaC'. Vous pouvez soit utiliser cette version partielle, soit essayer de générer à nouveau le document complet.",
      partialAnalysisResults: "Résultats d'analyse partiels",
      analysisCancelledMessage: "L'analyse du fichier téléchargé a été annulée. Les résultats partiels sont affichés ci-dessous. Vous pouvez soit utiliser ces résultats partiels, soit essayer d'analyser à nouveau le fichier complet.",
      partialIacGeneration: "Génération partielle du document IaC",
      tryGeneratingAgain: "Vous pouvez essayer de générer à nouveau le document complet après avoir attendu quelques minutes.",
      analysisLanguageNotice: "Les résultats d'analyse seront générés en {language}. Les noms des meilleures pratiques resteront en anglais pour la cohérence avec la documentation AWS.",
    },
    lensSelector: {
      selectLens: "Sélectionner une lentille",
      wellArchitectedFramework: "Framework Well-Architected",
    },
    pillarSelector: {
      selectPillars: "Sélectionner les piliers",
      operationalExcellence: "Excellence opérationnelle",
      security: "Sécurité",
      reliability: "Fiabilité",
      performanceEfficiency: "Efficacité des performances",
      costOptimization: "Optimisation des coûts",
      sustainability: "Durabilité",
    },
    iacTemplateSelector: {
      selectTemplate: "Sélectionner un modèle",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "Documents de support",
      description: "Téléchargez des documents de support pour fournir un contexte supplémentaire",
    },
    propertyFilter: {
      filteringAriaLabel: "Filtrer les propriétés",
      filteringPlaceholder: "Filtrer les propriétés",
      clearFiltersText: "Effacer les filtres",
      cancelActionText: "Annuler",
      applyActionText: "Appliquer",
      operationAndText: "et",
      operationOrText: "ou",
      operatorContainsText: "Contient",
      operatorDoesNotContainText: "Ne contient pas",
      operatorEqualsText: "Égal",
      operatorDoesNotEqualText: "N'égale pas",
      operatorStartsWithText: "Commence par",
      groupValuesLabel: {
        pillar: "Pilier",
        question: "Question",
        bestPractice: "Meilleure pratique",
        relevance: "Pertinence",
        status: "Statut",
      },
    },
    pagination: {
      nextPageLabel: "Page suivante",
      previousPageLabel: "Page précédente",
      pageLabel: (pageNumber: number) => `Page ${pageNumber}`,
    },
    chat: {
      generatingResponse: "Génération de la réponse",
      analyzerAssistant: "Assistant Analyseur",
      you: "Vous",
      removeFile: (index: number) => `Supprimer le fichier ${index + 1}`,
      showFewerFiles: "Afficher moins de fichiers",
      showMoreFiles: "Afficher plus de fichiers",
      errorIconAriaLabel: "Erreur",
      warningIconAriaLabel: "Avertissement",
      loadingConversation: "Chargement de la conversation",
      askAboutYourResults: "Posez des questions sur vos résultats",
    },
    language: {
      title: "Langue",
      select: "Sélectionner la langue",
      switchTo: "Passer à {language}",
    },
    settings: {
      title: "Paramètres",
      language: "Langue",
      selectLanguage: "Sélectionner la langue",
    },
    descriptions: {
      lensSelector: "Sélectionnez quelle lentille Well-Architected utiliser pour examiner votre infrastructure",
      workloadIdInput: "Entrez optionnellement un ID de charge de travail Well-Architected Tool existant, ou laissez vide pour en créer un nouveau. (Remarque : Seuls ceux dont le nom commence par \"IaCAnalyzer_\" seront récupérés)",
      workloadIdInputDefaultLabel: "Sélectionner un ID de charge de travail (optionnel)",
      workloadIdInputDefaultDescription: "Laisser vide pour créer une nouvelle charge de travail",
      workloadIdInputNoWorkloadFound: "Aucune charge de travail trouvée",
    },
    leftPanel: {
      myWorkItems: "Mes éléments de travail",
      lenses: "Lentilles :",
      loadResults: "Charger les résultats :",
      downloadOriginalFile: "Télécharger le fichier original :",
      chatHistory: "Historique du chat",
      deleteWorkItem: "Supprimer l'élément de travail",
      reloadWorkItems: "Recharger les éléments de travail",
      deleteWorkItemModal: {
        title: "Supprimer l'élément de travail",
        message: "Êtes-vous sûr de vouloir supprimer cet élément de travail ? Toutes les données d'analyse associées seront supprimées.",
        warning: "Cette action ne peut pas être annulée.",
        cancel: "Annuler",
        delete: "Supprimer",
        status: "Statut",
      },
      deleteChatHistoryModal: {
        title: "Supprimer l'historique du chat",
        message: "Êtes-vous sûr de vouloir supprimer cet historique de chat ?",
        warning: "Cette action ne peut pas être annulée.",
        cancel: "Annuler",
        delete: "Supprimer",
      }
    },
    helpContent: {
      default: {
        header: 'À propos de l\'Analyseur IaC Well-Architected',
        description: 'Cet outil vous aide à évaluer vos conceptions d\'infrastructure par rapport aux meilleures pratiques du AWS Well-Architected Framework.',
        keyFeaturesTitle: 'Fonctionnalités principales',
        iacAnalysis: 'Analyse IaC : Téléchargez des modèles CloudFormation (YAML/JSON), Terraform ou AWS CDK pour une analyse automatisée',
        architectureReview: 'Revue d\'architecture : Téléchargez des diagrammes d\'architecture (PNG/JPG) et obtenez des recommandations IaC',
        analyzerAssistant: 'Chatbot Assistant de l\'Analyseur : Posez des questions, demandez des clarifications et recevez des conseils personnalisés sur les résultats de l\'analyse',
        waIntegration: 'Intégration AWS Well-Architected : Mettez à jour directement votre charge de travail dans AWS Well-Architected Tool',
        aiPoweredAnalysis: 'Analyse alimentée par l\'IA : Obtenez des recommandations détaillées en utilisant AWS Bedrock',
        howToUseTitle: 'Comment utiliser',
        step1: 'Téléchargez votre/vos document(s) IaC ou diagramme d\'architecture',
        step2: 'Sélectionnez les piliers Well-Architected à examiner. Vous pouvez également sélectionner différentes lentilles pour l\'analyse',
        step3: 'Téléchargez éventuellement un document de support pour fournir un contexte supplémentaire pour une meilleure analyse',
        step4: 'Fournissez éventuellement un ID de charge de travail Well-Architected Tool',
        step5: 'Examinez les résultats de l\'analyse et les recommandations',
        step6: 'Mettez à jour votre charge de travail Well-Architected Tool ou générez des modèles IaC',
        needHelpTitle: 'Besoin d\'aide ?',
        needHelpDescription: 'Recherchez les icônes d\'aide dans toute l\'application pour obtenir des informations détaillées sur des fonctionnalités spécifiques.',
        additionalResourcesTitle: 'Ressources supplémentaires',
        waFrameworkDocLink: 'Documentation du AWS Well-Architected Framework',
        waToolGettingStartedLink: 'Démarrer avec AWS Well-Architected Tool',
      },
      fileUpload: {
        header: 'Téléchargement de fichiers',
        description: 'Téléchargez vos documents Infrastructure as Code (IaC), diagramme d\'architecture ou documents PDF pour analyse :',
        iacFormats: 'Formats IaC pris en charge : YAML, JSON (CloudFormation), Terraform (.tf) et AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: 'Formats d\'image pris en charge : PNG, JPG, JPEG (max 3,75 Mo par image, dimensions ne dépassant pas 8000×8000 pixels)',
        documentFormats: 'Formats de document pris en charge : PDF (jusqu\'à 5 documents, max 4,5 Mo chacun)',
        maxSize: 'Pour les fichiers IaC et les projets ZIP : taille maximale 100 Mo',
        uploadOptions: 'Vous pouvez télécharger un seul fichier IaC, plusieurs fichiers liés, un projet complet (ZIP) ou une documentation architecturale sous forme de PDF. Lors du téléchargement d\'un diagramme d\'architecture, vous pouvez ensuite générer des modèles IaC basés sur l\'analyse.',
      },
      pillarSelection: {
        header: 'Piliers Well-Architected',
        description: 'Sélectionnez les piliers du Well-Architected Framework à inclure dans votre analyse :',
        operationalExcellence: 'Excellence opérationnelle : Opérations en tant que code, observabilité, etc.',
        security: 'Sécurité : Gestion des identités, protection des données, réponse aux incidents',
        reliability: 'Fiabilité : Planification de la reprise, adaptation aux changements, etc.',
        performanceEfficiency: 'Efficacité des performances : Optimisation des ressources, surveillance',
        costOptimization: 'Optimisation des coûts : Ressources rentables, sensibilisation aux dépenses',
        sustainability: 'Durabilité : Stratégies de réduction de l\'impact environnemental',
        learnMoreLink: 'En savoir plus sur les piliers Well-Architected',
      },
      analysisResults: {
        header: 'Résultats de l\'analyse',
        description: 'Examinez l\'analyse de votre infrastructure par rapport aux meilleures pratiques Well-Architected :',
        viewBestPractices: 'Consultez les meilleures pratiques appliquées, non appliquées et non pertinentes. Utilisez les filtres et préférences du tableau pour personnaliser votre vue.',
        statusIndicatorsTitle: 'Indicateurs de statut :',
        appliedGreen: 'Appliqué (Vert) : La meilleure pratique est implémentée dans votre infrastructure',
        notAppliedRed: 'Non appliqué (Rouge) : La meilleure pratique est pertinente mais non implémentée',
        notRelevantGrey: 'Non pertinent (Gris) : La meilleure pratique n\'est pas applicable à votre infrastructure',
        getMoreDetails: 'Obtenir plus de détails : Obtenez une analyse approfondie et des recommandations pour les meilleures pratiques sélectionnées',
        generateIacDocument: 'Générer un document IaC : Convertissez les diagrammes d\'architecture en code d\'infrastructure (disponible uniquement pour les téléchargements d\'images)',
        downloadAnalysis: 'Télécharger l\'analyse : Exportez tous les résultats et recommandations sous forme de fichier CSV',
      },
      wellArchitectedTool: {
        header: 'Intégration avec Well-Architected Tool',
        description: 'Suivez et gérez l\'alignement de votre charge de travail avec le AWS Well-Architected Framework :',
        viewRiskSummary: 'Consultez le résumé des risques pour tous les piliers',
        trackRisks: 'Suivez les risques élevés et moyens',
        generateReports: 'Générez des rapports Well-Architected Tool',
        workloadManagementTitle: 'Important : Gestion des charges de travail',
        completeReviewTitle: 'Compléter la revue Well-Architected Tool :',
        completeReviewWithId: 'Si vous avez fourni un ID de charge de travail existant dans les Paramètres optionnels : Les mises à jour seront effectuées sur cette charge de travail',
        completeReviewWithoutId: 'Si aucun ID de charge de travail n\'a été fourni : Une nouvelle charge de travail sera créée automatiquement',
        deleteWorkloadTitle: 'Supprimer la charge de travail Well-Architected Tool :',
        deleteWorkloadOnlyCreated: 'Disponible uniquement pour les charges de travail créées par cet outil',
        deleteWorkloadNotExisting: 'Non disponible pour les charges de travail existantes (où vous avez fourni l\'ID de charge de travail)',
        deleteWorkloadCleanup: 'Utilisez ceci pour nettoyer les charges de travail temporaires créées pendant votre analyse',
        securityNote: 'Remarque : Pour des raisons de sécurité, cet outil ne peut pas supprimer les charges de travail Well-Architected qu\'il n\'a pas créées. Si vous avez fourni votre propre ID de charge de travail, vous devrez gérer cette charge de travail directement dans la console AWS.',
        learnMoreLink: 'En savoir plus sur la gestion des charges de travail Well-Architected',
      },
      iacDocument: {
        header: 'Document IaC',
        description: 'Consultez et gérez les documents Infrastructure as Code générés :',
        reviewTemplates: 'Examinez les modèles IaC générés',
        copyToClipboard: 'Copiez le contenu dans le presse-papiers',
        downloadAsFile: 'Téléchargez sous forme de fichier',
        templatesNote: 'Les modèles sont générés en suivant les meilleures pratiques AWS et les recommandations Well-Architected.',
      },
      workloadId: {
        header: 'ID de charge de travail Well-Architected',
        description: 'L\'ID de charge de travail connecte votre analyse à AWS Well-Architected Tool :',
        optionalCreate: 'Optionnel : Ne sélectionnez aucune charge de travail spécifique pour en créer une nouvelle',
        selectExisting: 'Sélectionnez un ID existant pour mettre à jour une charge de travail existante',
        foundInConsole: 'Les charges de travail se trouvent dans la console AWS Well-Architected Tool',
        learnMoreLink: 'En savoir plus sur les charges de travail Well-Architected',
      },
      iacTypeSelection: {
        header: 'Sélection du type de modèle IaC',
        description: 'Choisissez le type de modèle Infrastructure as Code à générer :',
        cloudFormation: 'CloudFormation YAML/JSON : Générer des modèles AWS CloudFormation',
        terraform: 'Terraform : Générer des fichiers de configuration HashiCorp Terraform',
        awsCdkTitle: 'AWS CDK : Générer du code AWS Cloud Development Kit dans votre langage de programmation préféré :',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: 'Cette option n\'est disponible que lors de l\'analyse de diagrammes d\'architecture.',
      },
      supportingDocument: {
        header: 'Téléchargement de document de support',
        description: 'Améliorez votre analyse en téléchargeant un document de support qui fournit un contexte supplémentaire :',
        supportedFormatsTitle: 'Formats pris en charge :',
        supportedFormats: 'Documents PDF (.pdf), fichiers texte brut (.txt), images (.png, .jpg, .jpeg)',
        maxSizeTitle: 'Taille maximale :',
        maxSize: '4,5 Mo',
        descriptionTitle: 'Description :',
        descriptionText: 'Une brève description du document est requise pour aider l\'analyseur à comprendre son contenu',
        usageNote: 'Le document de support sera utilisé avec votre modèle IaC ou diagramme d\'architecture pour fournir plus de contexte lors de l\'analyse, ce qui peut potentiellement aboutir à des recommandations plus précises.',
        singleDocNote: 'Remarque : Un seul document de support (le plus récemment téléchargé) sera utilisé pour l\'analyse.',
      },
      lensSelection: {
        header: 'Sélection de la lentille Well-Architected',
        description: 'Sélectionnez quelle lentille AWS Well-Architected utiliser pour analyser votre infrastructure :',
        waFrameworkTitle: 'Well-Architected Framework :',
        waFrameworkDescription: 'Le Well-Architected Framework standard avec six piliers (Excellence opérationnelle, Sécurité, Fiabilité, Efficacité des performances, Optimisation des coûts, Durabilité)',
        specializedLensesTitle: 'Lentilles spécialisées :',
        specializedLensesDescription: 'Lentilles supplémentaires axées sur des technologies ou domaines spécifiques, telles que :',
        serverlessLens: 'Lentille Serverless - Pour les architectures d\'applications sans serveur',
        iotLens: 'Lentille IoT - Pour les charges de travail Internet des objets',
        saasLens: 'Lentille SaaS - Pour les architectures Software-as-a-Service',
        otherLenses: 'Et d\'autres lentilles spécialisées par industrie et technologie',
        lensExplanation: 'Chaque lentille fournit des meilleures pratiques et recommandations adaptées spécifiquement à ce domaine ou cette technologie. Les piliers disponibles pour examen changeront en fonction de la lentille sélectionnée.',
        whySpecializedTitle: 'Pourquoi utiliser des lentilles spécialisées ?',
        whySpecializedDescription: 'Les lentilles spécialisées fournissent des conseils plus ciblés pour des types de charges de travail spécifiques. Par exemple, la Lentille Serverless comprend des meilleures pratiques spécifiquement pertinentes pour l\'architecture sans serveur qui peuvent ne pas être couvertes dans le Well-Architected Framework standard.',
      },
    },
    riskSummary: {
      title: 'Résumé des risques',
      workloadId: 'ID de charge de travail',
      noWorkloadIdAssociated: 'Aucun ID de charge de travail associé',
      questionsAnswered: 'Questions répondues',
      highRisks: 'Risques élevés',
      mediumRisks: 'Risques moyens',
      pillar: 'Pilier',
      progress: 'Progression',
      completeReview: 'Compléter la revue Well-Architected Tool',
      generateReport: 'Générer un rapport Well-Architected Tool',
      deleteWorkload: 'Supprimer la charge de travail Well-Architected Tool',
      loadingRiskSummary: 'Chargement des données du résumé des risques...',
      deleteWorkloadModal: {
        title: 'Supprimer la charge de travail Well-Architected Tool',
        confirmMessage: 'Êtes-vous sûr de vouloir supprimer la charge de travail avec l\'ID',
        cannotUndo: 'Cette action ne peut pas être annulée.',
        note: 'Remarque :',
        noteMessage: 'Cela supprimera uniquement la charge de travail dans AWS Well-Architected Tool. Vos résultats d\'analyse et recommandations dans cette application resteront disponibles.',
      },
    },
  },
  ko: {
    common: {
      loading: "로딩 중",
      error: "오류",
      cancel: "취소",
      apply: "적용",
      clear: "지우기",
      confirm: "확인",
      close: "닫기",
      save: "저장",
      delete: "삭제",
      edit: "편집",
      add: "추가",
      remove: "제거",
      upload: "업로드",
      download: "다운로드",
      generate: "생성",
      analyze: "분석",
      filter: "필터",
      search: "검색",
      settings: "설정",
      help: "도움말",
      next: "다음",
      previous: "이전",
      page: "페이지",
      of: "/",
      match: "일치",
      matches: "일치",
      item: "항목",
      items: "항목",
      selected: "선택됨",
      notSelected: "선택되지 않음",
      all: "전체",
      none: "없음",
      yes: "예",
      no: "아니오",
      success: "성공",
      warning: "경고",
      info: "정보",
      and: "그리고",
      or: "또는",
      copy: "복사",
      contentCopied: "콘텐츠가 복사되었습니다",
      messageCopied: "메시지가 복사되었습니다",
      failedToCopy: "복사에 실패했습니다",
      detailedAnalysis: "상세 분석",
      generatedIacDocument: "생성된 IaC 문서",
    },
    app: {
      title: "Infrastructure as Code (IaC) 분석기",
      subtitle: "AWS Well-Architected Framework 모범 사례에 따라 인프라 코드 검토",
      navigation: {
        sideNavigation: "사이드 네비게이션",
        closeSideNavigation: "사이드 네비게이션 닫기",
        openSideNavigation: "사이드 네비게이션 열기",
        helpPanel: "도움말 패널",
        closeHelpPanel: "도움말 패널 닫기",
        openHelpPanel: "도움말 패널 열기",
        notifications: "알림",
      },
    },
    analysisResults: {
      title: "분석 결과",
      getMoreDetails: "자세한 정보 보기",
      generateIacDocument: "IaC 문서 생성",
      cancelIacGeneration: "IaC 생성 취소",
      downloadAnalysis: "분석 다운로드",
      bestPracticesReviewed: "검토된 모범 사례",
      bestPracticesApplied: "적용된 모범 사례",
      bestPracticesNotApplied: "미적용 모범 사례",
      bestPracticesNotRelevant: "관련 없는 모범 사례",
      pillar: "기둥",
      question: "질문",
      bestPractice: "모범 사례",
      status: "상태",
      reason: "이유",
      recommendations: "권장 사항",
      applied: "적용됨",
      notApplied: "미적용",
      notRelevant: "관련 없음",
      askAiForMoreRecommendations: "AI에게 더 많은 권장 사항 요청",
      preferences: "환경설정",
      pageSize: "페이지 크기",
      columnPreferences: "열 환경설정",
      noBestPracticesFound: "모범 사례를 찾을 수 없습니다",
      noMatches: "일치하는 항목 없음",
      clearFilter: "필터 지우기",
    },
    fileUpload: {
      title: "IaC 문서, 아키텍처 다이어그램 이미지 또는 PDF 문서 업로드",
      singleOrMultipleFiles: "단일 또는 다중 파일",
      completeIacProject: "전체 IaC 프로젝트",
      pdfDocuments: "PDF 문서",
      singleOrMultipleFilesDescription: "단일 또는 관련된 여러 IaC 문서를 업로드하세요. 또는 단일 아키텍처 다이어그램 이미지를 업로드하세요.",
      completeIacProjectDescription: "IaC 프로젝트 또는 저장소 파일이 포함된 .zip 파일을 업로드하세요. zip 내의 바이너리 및 미디어 파일은 제외됩니다.",
      pdfDocumentsDescription: "워크로드와 관련된 아키텍처 문서 및 기술 사양에 관한 텍스트, 차트, 시각 자료가 포함된 PDF 문서를 최대 5개(각 4.5MB 이하)까지 업로드하세요.",
      chooseFiles: "파일 선택",
      uploading: "업로드 중...",
      dropFilesToUpload: "파일을 드롭하여 업로드",
      dropZipFileToUpload: "ZIP 파일을 드롭하여 업로드",
      dropPdfFilesToUpload: "PDF 파일을 드롭하여 업로드 (최대 5개)",
      removeFile: "제거",
      filesUploadedSuccessfully: "파일이 성공적으로 업로드되었습니다",
      fileUploadedSuccessfully: "파일이 성공적으로 업로드되었습니다",
      errorUploadingFile: "파일 업로드 오류",
      uploadMode: "업로드 모드",
    },
    wellArchitectedAnalyzer: {
      startReview: "검토 시작",
      cancelReview: "검토 취소",
      cancelling: "취소 중...",
      optionalSettings: "선택적 설정",
      lensSelector: "렌즈 선택기",
      outputLanguage: "출력 언어",
      supportingDocumentUpload: "지원 문서 업로드",
      wellArchitectedTool: "Well-Architected 도구",
      iacGeneration: "IaC 생성",
      networkInterrupted: "네트워크 연결이 중단되었습니다",
      loadResults: "결과 로드",
      tokenLimitWarning: "토큰 한도 경고",
      currentWorkItem: "현재 작업 항목",
      currentLens: "현재 렌즈",
      currentLensResultsStatus: "현재 렌즈 결과 상태",
      currentLensSupportingDocument: "현재 렌즈 지원 문서",
      analysisResults: "분석 결과",
      iacDocument: "IaC 문서",
      iacDocumentUpdated: "IaC 문서 (업데이트됨)",
      analyzing: "업로드된 파일 분석 중",
      inProgress: "진행 중",
      completed: "완료됨",
      failed: "실패",
      notStarted: "시작되지 않음",
      partial: "부분 결과 - 중단됨",
      supportingDocumentDescription: "지원 문서 설명",
      downloadOriginalFile: "원본 파일 다운로드",
      selectLens: "렌즈 선택",
      iacGenerationOnlyForImages: "IaC 템플릿 생성은 아키텍처 다이어그램 이미지 분석 시에만 사용할 수 있습니다.",
      analysisProgress: "분석 진행 상황",
      iacGenerationProgress: "IaC 문서 생성 진행 상황",
      networkConnectionInterrupted: "네트워크 연결이 중단되었습니다",
      analysisLikelyCompleted: "분석 실행 중 네트워크 연결이 중단되었습니다. 분석이 백그라운드에서 완료되었을 가능성이 있습니다.",
      youCan: "다음을 수행할 수 있습니다:",
      clickLoadResults: "\"결과 로드\"를 클릭하여 최신 결과를 로드해 보세요",
      orExpandWorkItem: "또는 사이드 네비게이션 패널에서 작업 항목을 확장하고 \"결과 로드\"를 클릭하세요",
      tokenLimitExceeded: "프로젝트에 약 {count}개의 토큰이 포함되어 있으며, 이는 권장 한도인 200,000개를 초과합니다.",
      considerBreakingProject: "파일 크기가 커서 모델 호출이 실패하거나 분석이 컨텍스트를 잃을 수 있습니다. 더 나은 결과를 위해 프로젝트를 작은 부분으로 나누는 것을 고려하세요.",
      generationCancelled: "생성이 취소되었습니다",
      partialVersionGenerated: "IaC 문서 생성이 취소되었습니다. 부분 버전이 생성되었으며 'IaC 문서' 탭에서 볼 수 있습니다. 이 부분 버전을 사용하거나 전체 문서를 다시 생성할 수 있습니다.",
      partialAnalysisResults: "부분 분석 결과",
      analysisCancelledMessage: "업로드된 파일의 분석이 취소되었습니다. 아래에 부분 결과가 표시됩니다. 이 부분 결과를 사용하거나 전체 파일을 다시 분석해 보세요.",
      partialIacGeneration: "부분 IaC 문서 생성",
      tryGeneratingAgain: "몇 분 후에 전체 문서 생성을 다시 시도할 수 있습니다.",
      analysisLanguageNotice: "분석 결과는 한국어로 생성됩니다. 모범 사례 이름은 AWS 문서와의 일관성을 위해 영어로 유지됩니다.",
    },
    lensSelector: {
      selectLens: "렌즈 선택",
      wellArchitectedFramework: "Well-Architected 프레임워크",
    },
    pillarSelector: {
      selectPillars: "기둥 선택",
      operationalExcellence: "운영 우수성",
      security: "보안",
      reliability: "안정성",
      performanceEfficiency: "성능 효율성",
      costOptimization: "비용 최적화",
      sustainability: "지속 가능성",
    },
    iacTemplateSelector: {
      selectTemplate: "IaC 템플릿 유형 선택",
      cloudFormation: "CloudFormation",
      terraform: "Terraform",
    },
    supportingDocumentUpload: {
      title: "지원 문서 업로드",
      description: "분석에 컨텍스트를 제공하기 위한 추가 문서 업로드",
    },
    propertyFilter: {
      filteringAriaLabel: "모범 사례 필터",
      filteringPlaceholder: "모범 사례 필터",
      clearFiltersText: "필터 지우기",
      cancelActionText: "취소",
      applyActionText: "적용",
      operationAndText: "그리고",
      operationOrText: "또는",
      operatorContainsText: "포함",
      operatorDoesNotContainText: "포함하지 않음",
      operatorEqualsText: "같음",
      operatorDoesNotEqualText: "같지 않음",
      operatorStartsWithText: "다음으로 시작",
      groupValuesLabel: {
        pillar: "기둥 값",
        question: "질문 값",
        bestPractice: "모범 사례 값",
        relevance: "관련성 값",
        status: "상태 값",
      },
    },
    pagination: {
      nextPageLabel: "다음 페이지",
      previousPageLabel: "이전 페이지",
      pageLabel: (pageNumber: number) => `전체 페이지 중 ${pageNumber} 페이지`,
    },
    chat: {
      generatingResponse: "응답 생성 중...",
      analyzerAssistant: "분석기 어시스턴트",
      you: "나",
      removeFile: (index: number) => `파일 ${index + 1} 제거`,
      showFewerFiles: "파일 더 적게 표시",
      showMoreFiles: "파일 더 보기",
      errorIconAriaLabel: "오류",
      warningIconAriaLabel: "경고",
      loadingConversation: "대화 로딩 중...",
      askAboutYourResults: "결과 또는 모범 사례에 대해 질문하세요...",
    },
    language: {
      title: "언어",
      select: "언어 선택",
      switchTo: "{language}로 전환"
    },
    settings: {
      title: "설정",
      language: "언어",
      selectLanguage: "언어 선택",
    },
    descriptions: {
      lensSelector: "인프라 검토에 사용할 Well-Architected 렌즈를 선택하세요",
      workloadIdInput: "기존 Well-Architected Tool 워크로드 ID를 입력하거나, 비워두면 새로 생성됩니다. (참고: \"IaCAnalyzer_\"로 시작하는 이름만 조회됩니다)",
      workloadIdInputDefaultLabel: "워크로드 ID 선택 (선택사항)",
      workloadIdInputDefaultDescription: "비워두면 새 워크로드가 생성됩니다",
      workloadIdInputNoWorkloadFound: "워크로드를 찾을 수 없습니다",
    },
    leftPanel: {
      myWorkItems: "내 작업 항목",
      lenses: "렌즈:",
      loadResults: "결과 로드:",
      downloadOriginalFile: "원본 파일 다운로드:",
      chatHistory: "채팅 기록:",
      deleteWorkItem: "작업 항목 삭제:",
      reloadWorkItems: "작업 항목 새로고침",
      deleteWorkItemModal: {
        title: "작업 항목 삭제",
        message: "작업 항목을 삭제하시겠습니까?",
        warning: "이 작업은 취소할 수 없습니다.",
        cancel: "취소",
        delete: "삭제",
        status: "분석 상태:"
      },
      deleteChatHistoryModal: {
        title: "채팅 기록 삭제",
        message: "채팅 기록을 삭제하시겠습니까?",
        warning: "이 작업은 취소할 수 없습니다.",
        cancel: "취소",
        delete: "삭제"
      },
    },
    helpContent: {
      default: {
        header: 'Well-Architected IaC 분석기 소개',
        description: '이 도구는 AWS Well-Architected Framework 모범 사례에 따라 인프라 설계를 평가하는 데 도움을 줍니다.',
        keyFeaturesTitle: '주요 기능',
        iacAnalysis: 'IaC 분석: CloudFormation (YAML/JSON), Terraform 또는 AWS CDK 템플릿을 업로드하여 자동 분석',
        architectureReview: '아키텍처 검토: 아키텍처 다이어그램 (PNG/JPG)을 업로드하고 IaC 권장 사항 받기',
        analyzerAssistant: '분석기 어시스턴트 챗봇: 질문하고, 설명을 요청하고, 분석 결과에 대한 맞춤형 안내 받기',
        waIntegration: 'AWS Well-Architected 통합: AWS Well-Architected Tool 워크로드를 직접 업데이트',
        aiPoweredAnalysis: 'AI 기반 분석: AWS Bedrock을 사용하여 상세 권장 사항 받기',
        howToUseTitle: '사용 방법',
        step1: 'IaC 문서 또는 아키텍처 다이어그램 업로드',
        step2: '검토할 Well-Architected 기둥 선택. 분석에 사용할 다른 렌즈도 선택 가능',
        step3: '더 나은 분석을 위해 추가 컨텍스트를 제공하는 지원 문서를 선택적으로 업로드',
        step4: '선택적으로 Well-Architected Tool 워크로드 ID 제공',
        step5: '분석 결과 및 권장 사항 검토',
        step6: 'Well-Architected Tool 워크로드 업데이트 또는 IaC 템플릿 생성',
        needHelpTitle: '도움이 필요하신가요?',
        needHelpDescription: '특정 기능에 대한 자세한 정보는 애플리케이션 전체에서 도움말 아이콘을 찾아보세요.',
        additionalResourcesTitle: '추가 리소스',
        waFrameworkDocLink: 'AWS Well-Architected Framework 문서',
        waToolGettingStartedLink: 'AWS Well-Architected Tool 시작하기',
      },
      fileUpload: {
        header: '파일 업로드',
        description: '분석을 위해 Infrastructure as Code (IaC) 문서, 아키텍처 다이어그램 또는 PDF 문서를 업로드하세요:',
        iacFormats: '지원되는 IaC 형식: YAML, JSON (CloudFormation), Terraform (.tf), AWS CDK (.ts, .py, .go, .java, .cs)',
        imageFormats: '지원되는 이미지 형식: PNG, JPG, JPEG (이미지당 최대 3.75MB, 8000×8000 픽셀 이하)',
        documentFormats: '지원되는 문서 형식: PDF (최대 5개 문서, 각 4.5MB 이하)',
        maxSize: 'IaC 파일 및 ZIP 프로젝트: 최대 크기 100MB',
        uploadOptions: '단일 IaC 파일, 여러 관련 파일, 전체 프로젝트 (ZIP) 또는 PDF 형태의 아키텍처 문서를 업로드할 수 있습니다. 아키텍처 다이어그램을 업로드하면 나중에 분석을 기반으로 IaC 템플릿을 생성할 수 있습니다.',
      },
      pillarSelection: {
        header: 'Well-Architected 기둥',
        description: '분석에 포함할 Well-Architected Framework 기둥을 선택하세요:',
        operationalExcellence: '운영 우수성: 코드로서의 운영, 관측 가능성 등',
        security: '보안: ID 관리, 데이터 보호, 인시던트 대응',
        reliability: '안정성: 복구 계획, 변화에 대한 적응 등',
        performanceEfficiency: '성능 효율성: 리소스 최적화, 모니터링',
        costOptimization: '비용 최적화: 비용 효율적인 리소스, 지출 인식',
        sustainability: '지속 가능성: 환경 영향 감소 전략',
        learnMoreLink: 'Well-Architected 기둥에 대해 자세히 알아보기',
      },
      analysisResults: {
        header: '분석 결과',
        description: 'Well-Architected 모범 사례에 따른 인프라 분석 검토:',
        viewBestPractices: '적용된, 미적용, 관련 없는 모범 사례를 확인하세요. 테이블 필터와 환경설정을 사용하여 뷰를 사용자 지정할 수 있습니다.',
        statusIndicatorsTitle: '상태 표시기:',
        appliedGreen: '적용됨 (녹색): 모범 사례가 인프라에 구현되어 있습니다',
        notAppliedRed: '미적용 (빨간색): 모범 사례는 관련이 있지만 구현되지 않았습니다',
        notRelevantGrey: '관련 없음 (회색): 모범 사례가 인프라에 적용되지 않습니다',
        getMoreDetails: '자세한 정보 보기: 선택한 모범 사례에 대한 심층 분석 및 권장 사항 받기',
        generateIacDocument: 'IaC 문서 생성: 아키텍처 다이어그램을 인프라 코드로 변환 (이미지 업로드에만 사용 가능)',
        downloadAnalysis: '분석 다운로드: 모든 발견 사항 및 권장 사항을 CSV 파일로 내보내기',
      },
      wellArchitectedTool: {
        header: 'Well-Architected Tool 통합',
        description: 'AWS Well-Architected Framework에 대한 워크로드 정렬을 추적하고 관리하세요:',
        viewRiskSummary: '모든 기둥에 대한 위험 요약 보기',
        trackRisks: '높음 및 중간 위험 추적',
        generateReports: 'Well-Architected Tool 보고서 생성',
        workloadManagementTitle: '중요: 워크로드 관리',
        completeReviewTitle: 'Well-Architected Tool 검토 완료:',
        completeReviewWithId: '선택적 설정에서 기존 워크로드 ID를 제공한 경우: 해당 워크로드에 업데이트가 적용됩니다',
        completeReviewWithoutId: '워크로드 ID가 제공되지 않은 경우: 새 워크로드가 자동으로 생성됩니다',
        deleteWorkloadTitle: 'Well-Architected Tool 워크로드 삭제:',
        deleteWorkloadOnlyCreated: '이 도구에서 생성된 워크로드에만 사용 가능',
        deleteWorkloadNotExisting: '기존 워크로드 (워크로드 ID를 제공한 경우)에는 사용 불가',
        deleteWorkloadCleanup: '분석 중 생성된 임시 워크로드를 정리하는 데 사용',
        securityNote: '참고: 보안상의 이유로 이 도구는 자체적으로 생성하지 않은 Well-Architected 워크로드를 삭제할 수 없습니다. 자신의 워크로드 ID를 제공한 경우 AWS 콘솔에서 직접 해당 워크로드를 관리해야 합니다.',
        learnMoreLink: 'Well-Architected 워크로드 관리에 대해 자세히 알아보기',
      },
      iacDocument: {
        header: 'IaC 문서',
        description: '생성된 Infrastructure as Code 문서 보기 및 관리:',
        reviewTemplates: '생성된 IaC 템플릿 검토',
        copyToClipboard: '클립보드에 복사',
        downloadAsFile: '파일로 다운로드',
        templatesNote: '템플릿은 AWS 모범 사례 및 Well-Architected 권장 사항에 따라 생성됩니다.',
      },
      workloadId: {
        header: 'Well-Architected 워크로드 ID',
        description: '워크로드 ID는 분석을 AWS Well-Architected Tool에 연결합니다:',
        optionalCreate: '선택사항: 새 워크로드를 생성하려면 특정 워크로드를 선택하지 마세요',
        selectExisting: '기존 워크로드를 업데이트하려면 기존 ID 선택',
        foundInConsole: '워크로드는 AWS Well-Architected Tool 콘솔에서 찾을 수 있습니다',
        learnMoreLink: 'Well-Architected 워크로드에 대해 자세히 알아보기',
      },
      iacTypeSelection: {
        header: 'IaC 템플릿 유형 선택',
        description: '생성할 Infrastructure as Code 템플릿 유형 선택:',
        cloudFormation: 'CloudFormation YAML/JSON: AWS CloudFormation 템플릿 생성',
        terraform: 'Terraform: HashiCorp Terraform 구성 파일 생성',
        awsCdkTitle: 'AWS CDK: 선호하는 프로그래밍 언어로 AWS Cloud Development Kit 코드 생성:',
        typescript: 'TypeScript (.ts)',
        python: 'Python (.py)',
        go: 'Go (.go)',
        java: 'Java (.java)',
        csharp: 'C# (.cs)',
        availabilityNote: '이 옵션은 아키텍처 다이어그램을 분석할 때만 사용할 수 있습니다.',
      },
      supportingDocument: {
        header: '지원 문서 업로드',
        description: '추가 컨텍스트를 제공하는 지원 문서를 업로드하여 분석을 향상시키세요:',
        supportedFormatsTitle: '지원되는 형식:',
        supportedFormats: 'PDF 문서 (.pdf), 일반 텍스트 파일 (.txt), 이미지 (.png, .jpg, .jpeg)',
        maxSizeTitle: '최대 크기:',
        maxSize: '4.5MB',
        descriptionTitle: '설명:',
        descriptionText: '분석기가 내용을 이해하는 데 도움이 되도록 문서에 대한 간략한 설명이 필요합니다',
        usageNote: '지원 문서는 IaC 템플릿 또는 아키텍처 다이어그램과 함께 사용되어 분석 중 더 많은 컨텍스트를 제공하여 더 정확한 권장 사항을 도출할 수 있습니다.',
        singleDocNote: '참고: 분석에는 하나의 지원 문서 (가장 최근에 업로드된 문서)만 사용됩니다.',
      },
      lensSelection: {
        header: 'Well-Architected 렌즈 선택',
        description: '인프라 분석에 사용할 AWS Well-Architected 렌즈 선택:',
        waFrameworkTitle: 'Well-Architected Framework:',
        waFrameworkDescription: '6개의 기둥 (운영 우수성, 보안, 안정성, 성능 효율성, 비용 최적화, 지속 가능성)을 가진 표준 Well-Architected Framework',
        specializedLensesTitle: '전문 렌즈:',
        specializedLensesDescription: '특정 기술 또는 도메인에 초점을 맞춘 추가 렌즈, 예:',
        serverlessLens: 'Serverless 렌즈 - 서버리스 애플리케이션 아키텍처용',
        iotLens: 'IoT 렌즈 - 사물 인터넷 워크로드용',
        saasLens: 'SaaS 렌즈 - Software-as-a-Service 아키텍처용',
        otherLenses: '기타 전문 산업 및 기술 렌즈',
        lensExplanation: '각 렌즈는 해당 도메인 또는 기술에 맞는 맞춤형 모범 사례 및 권장 사항을 제공합니다. 선택한 렌즈에 따라 검토 가능한 기둥이 변경됩니다.',
        whySpecializedTitle: '전문 렌즈를 사용하는 이유?',
        whySpecializedDescription: '전문 렌즈는 특정 워크로드 유형에 대해 더 집중된 안내를 제공합니다. 예를 들어, Serverless 렌즈에는 표준 Well-Architected Framework에서 다루지 않을 수 있는 서버리스 아키텍처에 특히 관련된 모범 사례가 포함되어 있습니다.',
      },
    },
    riskSummary: {
      title: '위험 요약',
      workloadId: '워크로드 ID',
      noWorkloadIdAssociated: '연결된 워크로드 ID 없음',
      questionsAnswered: '답변된 질문',
      highRisks: '높은 위험',
      mediumRisks: '중간 위험',
      pillar: '기둥',
      progress: '진행 상황',
      completeReview: 'Well-Architected Tool 검토 완료',
      generateReport: 'Well-Architected Tool 보고서 생성',
      deleteWorkload: 'Well-Architected Tool 워크로드 삭제',
      loadingRiskSummary: '위험 요약 데이터 로딩 중...',
      deleteWorkloadModal: {
        title: 'Well-Architected Tool 워크로드 삭제',
        confirmMessage: '다음 ID의 워크로드를 삭제하시겠습니까',
        cannotUndo: '이 작업은 취소할 수 없습니다.',
        note: '참고:',
        noteMessage: '이는 AWS Well-Architected Tool의 워크로드만 삭제합니다. 이 애플리케이션의 분석 결과 및 권장 사항은 계속 사용할 수 있습니다.',
      },
    },
  },
  // When adding a new language, add a new entry here
  // Example for Spanish:
  // es: {
  //   common: {
  //     // Spanish translations
  //   },
  //   // ... other Spanish categories  
  // }
};
