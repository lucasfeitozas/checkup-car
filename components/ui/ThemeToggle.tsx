import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../ThemeProvider";

export function ThemeToggle() {
  const { isDark, setTheme, userPreference } = useAppTheme();

  const toggleTheme = () => {
    if (userPreference === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(userPreference === "light" ? "dark" : "light");
    }
  };

  return (
    <Pressable onPress={toggleTheme}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm">
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={20}
          color={isDark ? "#2196F3" : "#E53935"}
        />
      </View>
    </Pressable>
  );
}
