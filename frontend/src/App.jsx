// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { ModelProvider, ThemeProvider, ProjectProvider } from './context';
import { useWindowResize } from './hooks';
import { 
  Sidebar,
  ChatWindow,
  ErrorBoundary,
  ToastContainer
} from './components';
import { Settings } from './components/settings';
import { logger } from './utils';
import { APP_CONFIG } from './config';
import './styles/index.css';

/**
 * Main application component
 */
function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'settings', 'project'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || APP_CONFIG.DEFAULT_THEME);
  
  // Use our window resize hook instead of manually handling resize
  const { isMobile } = useWindowResize();
  
  useEffect(() => {
    // Apply system theme preference if set to 'system'
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark-theme', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    }
  }, [theme]);
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    logger.debug('App', `Mobile menu ${!isMobileMenuOpen ? 'opened' : 'closed'}`);
  };
  
  // Toggle settings view
  const toggleSettings = () => {
    const newView = currentView === 'settings' ? 'chat' : 'settings';
    setCurrentView(newView);
    logger.info('App', `View changed to ${newView}`);
    
    // Close mobile menu when changing views
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Navigate to project page
  const navigateToProject = (projectId) => {
    setCurrentProjectId(projectId);
    setCurrentView('project');
    logger.info('App', `Navigating to project view`, { projectId });
    
    // Close mobile menu when navigating
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Navigate to chat view
  const navigateToChat = (chatId) => {
    setCurrentView('chat');
    logger.info('App', `Navigating to chat view`, chatId ? { chatId } : {});
    
    // Close mobile menu when navigating
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Handle error in the application
  const handleAppError = (error) => {
    logger.error('App', 'Application error caught', { error: error.toString() });
  };
  
  // Render the main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'settings':
        return <Settings onClose={toggleSettings} />;
        
      case 'project':
        return (
          <ChatWindow 
            onNavigateToProject={navigateToProject}
            currentProjectId={currentProjectId}
            onNavigateToChat={navigateToChat}
            currentView={currentView}
            toggleSettings={toggleSettings}
          />
        );
        
      case 'chat':
      default:
        return (
          <ChatWindow 
            onNavigateToProject={navigateToProject}
            isSettingsView={false}
            currentProjectId={null}
            onNavigateToChat={navigateToChat}
            currentView={currentView}
            toggleSettings={toggleSettings}
          />
        );
    }
  };
  
  return (
    <ErrorBoundary onError={handleAppError}>
      <div className={`app-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <ThemeProvider initialTheme={theme} onThemeChange={setTheme}>
          <ModelProvider>
            <ProjectProvider>
              <div className="app">
                <div className={`sidebar-container ${isMobileMenuOpen ? 'sidebar-container--open' : ''}`}>
                  <Sidebar 
                    closeMobileMenu={() => setIsMobileMenuOpen(false)} 
                    onToggleSettings={toggleSettings}
                    showSettings={currentView === 'settings'}
                    onNavigateToProject={navigateToProject}
                    onNavigateToChat={navigateToChat}
                    currentView={currentView}
                  />
                </div>
                
                <div className="main-content">
                  {isMobile && (
                    <button 
                      className="menu-toggle" 
                      onClick={toggleMobileMenu}
                      aria-label="Toggle menu"
                    >
                      {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                  )}
                  
                  {renderMainContent()}
                </div>
                
                <ToastContainer />
              </div>
            </ProjectProvider>
          </ModelProvider>
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;