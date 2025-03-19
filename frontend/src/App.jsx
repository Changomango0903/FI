import React, { useState, useEffect } from 'react';
import { ModelProvider } from './context/ModelContext';
import { ThemeProvider } from './context/ThemeContext';
import { InstallationProvider } from './context/InstallationContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import EnhancedSettings from './components/EnhancedSettings';
import ModelLibrary from './components/ModelLibrary';
import './styles/index.css';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSettings, setShowSettings] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
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
    setShowLibrary(false);
  };
  
  // Toggle library visibility
  const toggleLibrary = () => {
    setShowLibrary(!showLibrary);
    setShowSettings(false);
  };
  
  return (
    <ThemeProvider>
      <ModelProvider>
        <InstallationProvider>
          <div className="app">
            <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
              <Sidebar 
                closeMobileMenu={() => setIsMobileMenuOpen(false)} 
                onToggleSettings={toggleSettings}
                onToggleLibrary={toggleLibrary}
                showSettings={showSettings}
                showLibrary={showLibrary}
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
              
              {showSettings ? (
                <EnhancedSettings onClose={toggleSettings} />
              ) : showLibrary ? (
                <ModelLibrary onClose={toggleLibrary} />
              ) : (
                <ChatWindow />
              )}
            </div>
          </div>
        </InstallationProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}

export default App;