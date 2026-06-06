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

import { themes, type AppTheme } from "@/theme/theme";
import { storage } from "@/core/storage/storage";

const THEME_STORAGE_KEY = "app-theme-preference";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  userPreference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<ThemePreference>("system");

  // Carrega a preferência salva ao iniciar
  useEffect(() => {
    const loadPreference = async () => {
      const saved = await storage.getItem(THEME_STORAGE_KEY);
      if (isThemePreference(saved)) {
        setUserPreference(saved);
      }
    };
    loadPreference();
  }, []);

  const setTheme = async (preference: ThemePreference) => {
    setUserPreference(preference);
    await storage.setItem(THEME_STORAGE_KEY, preference);
  };

  const activeScheme = useMemo(() => {
    if (userPreference === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return userPreference;
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
