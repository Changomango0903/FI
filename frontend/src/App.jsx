import React, { useState, useEffect } from 'react';
import { ModelProvider } from './context/ModelContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsPage from './components/SettingsPage';
import './styles/index.css';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSettings, setShowSettings] = useState(false);
  
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
  
  const handleOpenSettings = () => {
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  return (
    <ModelProvider>
      <div className="app">
        <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
          <Sidebar 
            closeMobileMenu={() => setIsMobileMenuOpen(false)} 
            onOpenSettings={handleOpenSettings}
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
            <SettingsPage onClose={handleCloseSettings} />
          ) : (
            <ChatWindow />
          )}
        </div>
      </div>
    </ModelProvider>
  );
}

export default App;