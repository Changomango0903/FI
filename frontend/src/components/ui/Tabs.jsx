import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils';

/**
 * Tab Panel component - represents content for each tab
 */
const TabPanel = ({ children, id, active }) => {
  return (
    <div 
      id={`panel-${id}`}
      role="tabpanel"
      tabIndex={0}
      className={`tab-panel ${active ? 'active' : ''}`}
      aria-labelledby={`tab-${id}`}
    >
      {children}
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired
};

/**
 * Tab Item component - represents a clickable tab
 */
const TabItem = ({ 
  id, 
  label, 
  icon, 
  active, 
  onClick, 
  disabled, 
  badge, 
  badgeType 
}) => {
  return (
    <button 
      id={`tab-${id}`}
      role="tab"
      className={`tab-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      tabIndex={active ? 0 : -1}
      onClick={disabled ? undefined : () => onClick(id)}
      disabled={disabled}
    >
      {icon && <span className="tab-item-icon">{icon}</span>}
      {label}
      {badge && (
        <span className={`tab-badge ${badgeType ? `tab-badge--${badgeType}` : ''}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

TabItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  icon: PropTypes.node,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  badgeType: PropTypes.oneOf(['primary', 'success', 'warning', 'danger'])
};

/**
 * Tabs component - container for tabs and their content
 */
const Tabs = ({ 
  children, 
  defaultTab, 
  onChange, 
  vertical = false, 
  responsive = false 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Get arrays of tab children and panel children
  const tabs = React.Children.toArray(children).filter(
    child => child.type === TabItem
  );
  
  const panels = React.Children.toArray(children).filter(
    child => child.type === TabPanel
  );
  
  // Handle tab click
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
    logger.debug('Tabs', `Tab changed to ${tabId}`);
  };
  
  // Set default tab on mount or when defaultTab changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  return (
    <div className={`tabs ${vertical ? 'tabs--vertical' : ''} ${responsive ? 'tabs--responsive' : ''}`}>
      <div className="tab-nav" role="tablist">
        {React.Children.map(tabs, tab => 
          React.cloneElement(tab, {
            active: tab.props.id === activeTab,
            onClick: handleTabClick
          })
        )}
      </div>
      
      <div className="tab-content">
        {React.Children.map(panels, panel => 
          React.cloneElement(panel, {
            active: panel.props.id === activeTab
          })
        )}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTab: PropTypes.string,
  onChange: PropTypes.func,
  vertical: PropTypes.bool,
  responsive: PropTypes.bool
};

// Export all components
Tabs.Item = TabItem;
Tabs.Panel = TabPanel;

export default Tabs; 