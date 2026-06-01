import type { ColorSchemeName } from "react-native";

export type ThemeName = "light" | "dark";

export type AppTheme = {
  name: ThemeName;
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
};

export const lightTheme: AppTheme = {
  name: "light",
  background: "#FFFFFF",
  surface: "#F5F5F5",
  primary: "#E53935",
  accent: "#E53935",
  text: "#1A1A1A",
  muted: "#757575",
  border: "#E0E0E0",
};

export const darkTheme: AppTheme = {
  name: "dark",
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#2196F3",
  accent: "#2196F3",
  text: "#FFFFFF",
  muted: "#B0BEC5",
  border: "#333333",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export function resolveTheme(colorScheme: ColorSchemeName): AppTheme {
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
