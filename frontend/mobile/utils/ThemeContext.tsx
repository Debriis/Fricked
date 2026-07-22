import React, { createContext, useContext, useEffect, useState } from "react";
import { THEMES, Theme, ThemeKey, ALL_THEME_KEYS, loadTheme, saveTheme } from "./theme";

type ThemeContextType = {
    theme: Theme;
    themeKey: ThemeKey;
    setTheme: (key: ThemeKey) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: THEMES.VOID,
    themeKey: "VOID",
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeKey, setThemeKey] = useState<ThemeKey>("VOID");

    useEffect(() => {
        loadTheme().then(setThemeKey);
    }, []);

    const setTheme = (key: ThemeKey) => {
        setThemeKey(key);
        saveTheme(key);
    };

    return (
        <ThemeContext.Provider value={{ theme: THEMES[themeKey], themeKey, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);