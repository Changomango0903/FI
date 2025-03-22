import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils';

/**
 * Error boundary component to catch and display React errors
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logging system
    logger.error('ErrorBoundary', 'React component error', { 
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ errorInfo });
    
    // Call onError if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    logger.info('ErrorBoundary', 'Resetting error state');
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call onReset if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }
      
      // Otherwise use the default error UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p className="error-message">
              {error && error.toString()}
            </p>
            
            {this.props.showDetails && errorInfo && (
              <details>
                <summary>Component Stack</summary>
                <pre>{errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="reset-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV !== 'production'
};

export default ErrorBoundary; 