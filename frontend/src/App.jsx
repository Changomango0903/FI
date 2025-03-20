// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { ModelProvider } from './context/ModelContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsPage from './components/SettingsPage';
import ProjectPage from './components/ProjectPage';
import './styles/index.css';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'settings', 'project'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Toggle settings visibility
  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setCurrentView(showSettings ? 'chat' : 'settings');
  };
  
  // Navigate to project page
  const navigateToProject = (projectId) => {
    setCurrentProjectId(projectId);
    setCurrentView('project');
    setShowSettings(false);
  };
  
  // Navigate to chat view
  const navigateToChat = () => {
    setCurrentView('chat');
  };
  
  // Render the main content based on current view
  const renderMainContent = () => {
    if (showSettings || currentView === 'settings') {
      return <SettingsPage onClose={toggleSettings} />;
    }
    
    if (currentView === 'project' && currentProjectId) {
      return (
        <ProjectPage 
          projectId={currentProjectId}
          onNavigateToChat={navigateToChat}
          onBack={navigateToChat}
        />
      );
    }
    
    return <ChatWindow />;
  };
  
  return (
    <ThemeProvider>
      <ModelProvider>
        <ProjectProvider>
          <div className="app">
            <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
              <Sidebar 
                closeMobileMenu={() => setIsMobileMenuOpen(false)} 
                onToggleSettings={toggleSettings}
                showSettings={showSettings}
                onNavigateToProject={navigateToProject}
              />
            </div>
            
            <div className="main-content">
              {windowWidth < 768 && (
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
          </div>
        </ProjectProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}

export default App;