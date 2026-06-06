import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme, View } from "react-native";
import { ThemeProvider as StyledThemeProvider } from "styled-components/native";

import { themes, type AppTheme } from "@/constants/theme";
import { storage } from "@/lib/storage";

const THEME_STORAGE_KEY = "app-theme-preference";

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  userPreference: "light" | "dark" | "system";
  setTheme: (preference: "light" | "dark" | "system") => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<"light" | "dark" | "system">("system");

  // Carrega a preferência salva ao iniciar
  useEffect(() => {
    const loadPreference = async () => {
      const saved = await storage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setUserPreference(saved as any);
      }
    };
    loadPreference();
  }, []);

  const setTheme = async (preference: "light" | "dark" | "system") => {
    setUserPreference(preference);
    await storage.setItem(THEME_STORAGE_KEY, preference);
  };

  const activeScheme = useMemo(() => {
    if (userPreference === "system") {
      return (systemColorScheme === "dark" ? "dark" : "light") as "light" | "dark";
    }
    return userPreference as "light" | "dark";
  }, [userPreference, systemColorScheme]);

  const theme = useMemo(() => themes[activeScheme], [activeScheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme.name === "dark",
      userPreference,
      setTheme,
    }),
    [theme, userPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>{children}</View>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return context;
}
