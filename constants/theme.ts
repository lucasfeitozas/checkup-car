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
  surface: "#F7F7F8",
  primary: "#C8102E",
  accent: "#003B9A",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
};

export const darkTheme: AppTheme = {
  name: "dark",
  background: "#0A0A0F",
  surface: "#14141C",
  primary: "#1565FF",
  accent: "#003B9A",
  text: "#F0F0F0",
  muted: "#A1A1AA",
  border: "#27272A",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export function resolveTheme(colorScheme: ColorSchemeName): AppTheme {
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
