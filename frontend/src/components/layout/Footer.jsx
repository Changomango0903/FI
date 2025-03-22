import React from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils';
import { APP_CONFIG } from '../../config';

/**
 * Application footer component
 * @param {Object} props - Component props
 * @param {boolean} props.isSticky - Whether the footer should be sticky at bottom
 */
const Footer = ({ isSticky = false }) => {
  logger.debug('Footer', 'Rendering footer component');

  const year = new Date().getFullYear();
  
  return (
    <footer className={`footer ${isSticky ? 'footer--sticky' : ''}`}>
      <div className="footer__left">
        <a href="https://github.com/username/fast-intelligence" 
           className="footer__link"
           target="_blank" 
           rel="noopener noreferrer">
          GitHub
        </a>
        <a href="/docs"
           className="footer__link">
          Documentation
        </a>
      </div>
      
      <div className="footer__center">
        <span>© {year} Fast Intelligence. All rights reserved.</span>
      </div>
      
      <div className="footer__right">
        <span className="footer__version">v{APP_CONFIG.APP_VERSION}</span>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  isSticky: PropTypes.bool
};

export default Footer; 