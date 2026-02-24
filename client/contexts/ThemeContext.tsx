import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "corporate" | "ghibli";
export type ColorMode = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  colorMode: ColorMode;
  setTheme: (theme: Theme) => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [colorMode, setColorModeState] = useState<ColorMode>("light");

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("ticketing-theme") as Theme | null;
    const savedColorMode = localStorage.getItem("ticketing-color-mode") as ColorMode | null;

    if (savedTheme) setThemeState(savedTheme);
    if (savedColorMode) setColorModeState(savedColorMode);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "corporate", "ghibli");
    
    // Add appropriate classes based on colorMode and theme
    if (colorMode === "dark") {
      root.classList.add("dark");
    }
    
    if (theme !== "light") {
      root.classList.add(theme);
    }

    // Save to localStorage
    localStorage.setItem("ticketing-theme", theme);
    localStorage.setItem("ticketing-color-mode", colorMode);
  }, [theme, colorMode]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorMode,
        setTheme,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
