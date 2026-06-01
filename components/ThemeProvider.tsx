import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useColorScheme, View } from "react-native";
import { vars } from "nativewind";

import { resolveTheme, type AppTheme } from "@/constants/theme";

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const theme = resolveTheme(colorScheme);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme.name === "dark",
    }),
    [theme],
  );

  const cssVariables = vars({
    "--color-background": theme.background,
    "--color-surface": theme.surface,
    "--color-primary": theme.primary,
    "--color-accent": theme.accent,
    "--color-text": theme.text,
    "--color-muted": theme.muted,
    "--color-border": theme.border,
  });

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-background" style={cssVariables}>
        {children}
      </View>
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
