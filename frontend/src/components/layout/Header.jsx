import React from 'react';
import PropTypes from 'prop-types';
import { useModelContext } from '../../context/ModelContext';
import { useThemeContext } from '../../context/ThemeContext';
import { ThemeToggle } from '../ui';
import { logger } from '../../utils';

/**
 * Main application header component
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display in header
 * @param {Function} props.onMenuToggle - Function to toggle mobile menu
 * @param {boolean} props.showMobileMenu - Whether mobile menu is visible
 */
const Header = ({ title = 'Fast Intelligence', onMenuToggle, showMobileMenu }) => {
  const { theme } = useThemeContext();
  const { selectedModel } = useModelContext();

  logger.debug('Header', 'Rendering header component', { theme, selectedModel });

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__button mobile-only"
          onClick={onMenuToggle}
          aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
        >
          {showMobileMenu ? '✕' : '☰'}
        </button>
        
        <a href="/" className="header__logo">
          <img src="/logo.svg" alt="Logo" className="header__logo-image" />
          <span className="header__logo-text">{title}</span>
        </a>
      </div>
      
      <div className="header__center">
        {selectedModel && (
          <div className="header__model-info">
            Using: <strong>{selectedModel.display_name || selectedModel.name}</strong>
          </div>
        )}
      </div>
      
      <div className="header__right">
        <ThemeToggle />
      </div>
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  onMenuToggle: PropTypes.func.isRequired,
  showMobileMenu: PropTypes.bool.isRequired
};

export default Header; 