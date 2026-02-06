import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }) {
  const [userOverride, setUserOverride] = useState(() => {
    // Clean local storage so no annoying bugs
    localStorage.removeItem("theme");
    return localStorage.getItem("theme-override") || null;
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (event) => {
      const newSystemTheme = event.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
      // Make the site always prioritize system theme when it is changed
      setUserOverride(null);
      localStorage.removeItem("theme-override");
    };

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Effective theme
  const theme = userOverride || systemTheme;

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Persist user override
  useEffect(() => {
    if (userOverride) {
      localStorage.setItem("theme-override", userOverride);
    } else {
      localStorage.removeItem("theme-override");
    }
  }, [userOverride]);

  const toggleTheme = () => {
    setUserOverride(theme === "light" ? "dark" : "light");
  };

  const resetToSystem = () => {
    setUserOverride(null);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, resetToSystem, userOverride }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
