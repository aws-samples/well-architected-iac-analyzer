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
      pdfDocumentsDescription: "Upload up to 5 PDF documents (max 4.5MB each) with text related to architectural documentation and technical specifications relevant to your workload.",
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
      workloadIdInput: "Optionally enter an existing Well-Architected Tool workload ID, or leave empty to create a new one.",
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
      pdfDocumentsDescription: "ワークロードに関連するアーキテクチャドキュメントと技術仕様のテキストを含む最大 5 つの PDF ドキュメント（各最大 4.5MB）をアップロードします。",
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
      workloadIdInput: "既存のWell-Architected Toolワークロード IDを入力するか、空のままにして新しいものを作成してください。",
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
      pdfDocumentsDescription: "Suba hasta 5 documentos PDF (máx. 4.5MB cada uno) con texto relacionado con documentación arquitectónica y especificaciones técnicas relevantes para su carga de trabajo.",
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
      workloadIdInput: "Opcionalmente, ingrese un ID de carga de trabajo existente de Well-Architected Tool, o deje en blanco para crear uno nuevo.",
    }
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
      pdfDocumentsDescription: "Envie até 5 documentos PDF (máx. 4,5MB cada) com texto relacionado à documentação arquitetônica e especificações técnicas relevantes para sua carga de trabalho.",
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
      workloadIdInput: "Opcionalmente, insira um ID de carga de trabalho existente da  Well-Architected Tool, ou deixe em branco para criar um novo.",
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
