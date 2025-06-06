import { AppLayout, ContentLayout, Header, TopNavigation, HelpPanel } from '@cloudscape-design/components';
import { WellArchitectedAnalyzer } from './components/WellArchitectedAnalyzer';
import { HelpPanelProvider, useHelpPanel } from './contexts/HelpPanelContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useUserMenuUtilities } from './components/UserMenu';
import { helpContent } from './components/utils/help-content';
import { HelpButton } from './components/utils/HelpButton';

import { WorkSideNavigation, WorkSideNavigationRef } from './components/WorkSideNavigation';
import '@cloudscape-design/global-styles/index.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { WorkItem } from './types';
import { ChatProvider } from './components/chat/ChatContext';

function AppContent() {
  const { isToolsOpen, content, setIsToolsOpen } = useHelpPanel();
  const { authState } = useAuth();
  const { strings, language, setLanguage } = useLanguage();
  const defaultContent = helpContent.default;
  const userMenuUtilities = useUserMenuUtilities();
  const [activeFileId, setActiveFileId] = useState<string>();
  const sideNavRef = useRef<WorkSideNavigationRef>(null);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const appLayoutRef = useRef<{ closeNavigationIfNecessary: () => void }>(null);
  const [activeLensName, setActiveLensName] = useState<string | undefined>('Well-Architected Framework');
  const [activeLensAliasArn, setActiveLensAliasArn] = useState<string | undefined>('arn:aws:wellarchitected::aws:lens/wellarchitected');

  // Effect to handle initial navigation state
  useEffect(() => {
    // Close navigation if necessary on mount
    appLayoutRef.current?.closeNavigationIfNecessary();

    // Add resize listener
    const handleResize = () => {
      appLayoutRef.current?.closeNavigationIfNecessary();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAnalysisStart = (lensAliasArn: string, lensName: string) => {
    setActiveLensAliasArn(lensAliasArn);
    setActiveLensName(lensName);
  };

  const handleCurrentLensResultsSelection = (lensAliasArn?: string, lensName?: string) => {
    setActiveLensAliasArn(lensAliasArn);
    setActiveLensName(lensName);
  };

  const handleResetActiveFile = () => {
    setActiveFileId(undefined);
  };

  const handleSectionExpand = (workItem: WorkItem) => {
    setActiveFileId(workItem.fileId);
  };

  const handleWorkItemSelect = async (workItem: WorkItem, loadResults: boolean = true, lensAliasArn?: string, lensName?: string) => {
    setActiveFileId(workItem.fileId);
    setActiveLensName(lensName);
    setActiveLensAliasArn(lensAliasArn);

    if (loadResults) {
      // Get reference to WellArchitectedAnalyzer component
      const analyzerElement = document.querySelector('[data-testid="well-architected-analyzer"]');
      if (analyzerElement) {
        return new Promise<void>((resolve) => {
          // Create and dispatch the event
          const event = new CustomEvent('workItemSelected', {
            detail: { workItem, lensAliasArn },
            bubbles: true
          });

          // Add one-time event listener for when loading is complete
          const handleLoadComplete = () => {
            resolve();
            analyzerElement.removeEventListener('loadComplete', handleLoadComplete);
          };

          analyzerElement.addEventListener('loadComplete', handleLoadComplete);
          analyzerElement.dispatchEvent(event);
        });
      }
    }
    return Promise.resolve();
  };

  // Handler for work items refresh
  const handleWorkItemsRefresh = useCallback(() => {
    sideNavRef.current?.loadWorkItems();
  }, []);

  return (
    <div>
      <TopNavigation
        identity={{
          href: '#',
          title: strings.app.title,
          logo: {
            src: "/aws-wa-logo.png",
            alt: "Well-Architected"
          }
        }}
        utilities={[
          ...userMenuUtilities,
          {
            type: 'menu-dropdown',
            iconName: 'settings',
            ariaLabel: strings.settings.title,
            items: [
              {
                id: 'language-section',
                text: strings.settings.language,
                items: [
                  {
                    id: 'en',
                    text: strings.language.english,
                    checked: language === 'en'
                  },
                  {
                    id: 'ja',
                    text: strings.language.japanese,
                    checked: language === 'ja'
                  }
                ]
              }
            ],
            onItemClick: ({ detail }) => {
              if (detail.id === 'en' || detail.id === 'ja') {
                setLanguage(detail.id);
              }
            }
          }
        ]}
      />
      <ChatProvider fileId={activeFileId} lensName={activeLensName} lensAliasArn={activeLensAliasArn}>
        <AppLayout
          content={
            <ContentLayout
              header={
                <Header
                  variant="h3"
                  info={<HelpButton contentId="default" />}
                >
                  {strings.app.subtitle}
                </Header>
              }
            >
              <div data-testid="well-architected-analyzer" key="analyzer">
                <WellArchitectedAnalyzer onWorkItemsRefreshNeeded={handleWorkItemsRefresh} onAnalysisStart={handleAnalysisStart} onCurrentLensResultsSelection={handleCurrentLensResultsSelection} />
              </div>
            </ContentLayout>
          }
          navigation={authState.isAuthenticated ? (
            <WorkSideNavigation
              key="side-nav"
              ref={sideNavRef}
              activeFileId={activeFileId}
              onItemSelect={handleWorkItemSelect}
              onSectionExpand={handleSectionExpand}
              onResetActiveFile={handleResetActiveFile}
            />
          ) : undefined}
          navigationHide={!authState.isAuthenticated}
          navigationWidth={320}
          navigationOpen={isNavigationOpen}
          onNavigationChange={({ detail }) => setIsNavigationOpen(detail.open)}
          toolsOpen={isToolsOpen}
          onToolsChange={({ detail }) => setIsToolsOpen(detail.open)}
          tools={
            <HelpPanel
              key="help-panel"
              header={<h2>{content?.header || defaultContent.header}</h2>}
            >
              {content?.body || defaultContent.body}
            </HelpPanel>
          }
          maxContentWidth={Number.MAX_VALUE}
          ariaLabels={{
            navigation: strings.app.navigation.sideNavigation,
            navigationClose: strings.app.navigation.closeSideNavigation,
            navigationToggle: strings.app.navigation.openSideNavigation,
            notifications: strings.app.navigation.notifications,
            tools: strings.app.navigation.helpPanel,
            toolsClose: strings.app.navigation.closeHelpPanel,
            toolsToggle: strings.app.navigation.openHelpPanel
          }}
        />
      </ChatProvider>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HelpPanelProvider>
          <AppContent />
        </HelpPanelProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
