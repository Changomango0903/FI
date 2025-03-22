import React, { createContext, useContext } from 'react';
import { useTheme, THEMES } from '../hooks';

const ThemeContext = createContext({
  theme: THEMES.SYSTEM,
  effectiveTheme: THEMES.LIGHT,
  updateTheme: () => {},
  toggleTheme: () => {},
  THEMES: THEMES,
});

export const ThemeProvider = ({ children }) => {
  const themeState = useTheme();
  
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;