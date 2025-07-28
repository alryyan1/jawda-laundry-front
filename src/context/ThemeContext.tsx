import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';
import { getThemeColor } from '@/lib/colors';

// LocalStorage keys for theme persistence
const THEME_STORAGE_KEYS = {
  PRIMARY_COLOR: 'jawda-theme-primary-color',
  SECONDARY_COLOR: 'jawda-theme-secondary-color',
  PRIMARY_SHADE: 'jawda-theme-primary-shade',
  SECONDARY_SHADE: 'jawda-theme-secondary-shade',
} as const;

// Helper functions for localStorage management
const getStoredThemeColor = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to read theme color from localStorage:', error);
    return null;
  }
};

const setStoredThemeColor = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save theme color to localStorage:', error);
  }
};

const getStoredThemeShade = (key: string): number => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 500;
  } catch (error) {
    console.warn('Failed to read theme shade from localStorage:', error);
    return 500;
  }
};

const setStoredThemeShade = (key: string, value: number): void => {
  try {
    localStorage.setItem(key, value.toString());
  } catch (error) {
    console.warn('Failed to save theme shade to localStorage:', error);
  }
};

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  primaryColorShade: number;
  secondaryColorShade: number;
  setPrimaryColor: (color: string, shade?: number) => void;
  setSecondaryColor: (color: string, shade?: number) => void;
  getPrimaryColor: (shade?: number) => string;
  getSecondaryColor: (shade?: number) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  
  // Initialize shades from localStorage or default to 500
  const [primaryColorShade, setPrimaryColorShade] = useState(() => 
    getStoredThemeShade(THEME_STORAGE_KEYS.PRIMARY_SHADE)
  );
  const [secondaryColorShade, setSecondaryColorShade] = useState(() => 
    getStoredThemeShade(THEME_STORAGE_KEYS.SECONDARY_SHADE)
  );

  // Get colors from settings, localStorage, or defaults
  const getPrimaryColorFromStorage = () => {
    return getStoredThemeColor(THEME_STORAGE_KEYS.PRIMARY_COLOR) || 
           settings?.theme_primary_color || 
           'sky';
  };

  const getSecondaryColorFromStorage = () => {
    return getStoredThemeColor(THEME_STORAGE_KEYS.SECONDARY_COLOR) || 
           settings?.theme_secondary_color || 
           'blue';
  };

  const primaryColor = getPrimaryColorFromStorage();
  const secondaryColor = getSecondaryColorFromStorage();

  const setPrimaryColor = async (color: string, shade: number = 500) => {
    setPrimaryColorShade(shade);
    // Save to localStorage immediately for instant feedback
    setStoredThemeColor(THEME_STORAGE_KEYS.PRIMARY_COLOR, color);
    setStoredThemeShade(THEME_STORAGE_KEYS.PRIMARY_SHADE, shade);
    
    try {
      await updateSettings({ theme_primary_color: color });
    } catch (error) {
      console.error('Failed to update primary color:', error);
    }
  };

  const setSecondaryColor = async (color: string, shade: number = 500) => {
    setSecondaryColorShade(shade);
    // Save to localStorage immediately for instant feedback
    setStoredThemeColor(THEME_STORAGE_KEYS.SECONDARY_COLOR, color);
    setStoredThemeShade(THEME_STORAGE_KEYS.SECONDARY_SHADE, shade);
    
    try {
      await updateSettings({ theme_secondary_color: color });
    } catch (error) {
      console.error('Failed to update secondary color:', error);
    }
  };

  const getPrimaryColor = (shade: number = primaryColorShade) => {
    return getThemeColor(primaryColor, shade);
  };

  const getSecondaryColor = (shade: number = secondaryColorShade) => {
    return getThemeColor(secondaryColor, shade);
  };

  // Sync localStorage with settings when they change
  useEffect(() => {
    if (settings?.theme_primary_color) {
      setStoredThemeColor(THEME_STORAGE_KEYS.PRIMARY_COLOR, settings.theme_primary_color);
    }
    if (settings?.theme_secondary_color) {
      setStoredThemeColor(THEME_STORAGE_KEYS.SECONDARY_COLOR, settings.theme_secondary_color);
    }
  }, [settings?.theme_primary_color, settings?.theme_secondary_color]);

  // Update CSS custom properties when colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', getPrimaryColor());
    root.style.setProperty('--primary-color-light', getPrimaryColor(300));
    root.style.setProperty('--primary-color-dark', getPrimaryColor(700));
    root.style.setProperty('--secondary-color', getSecondaryColor());
    root.style.setProperty('--secondary-color-light', getSecondaryColor(300));
    root.style.setProperty('--secondary-color-dark', getSecondaryColor(700));
  }, [primaryColor, secondaryColor, primaryColorShade, secondaryColorShade]);

  const value: ThemeContextType = {
    primaryColor,
    secondaryColor,
    primaryColorShade,
    secondaryColorShade,
    setPrimaryColor,
    setSecondaryColor,
    getPrimaryColor,
    getSecondaryColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 