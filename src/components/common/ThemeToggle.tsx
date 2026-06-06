import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "styled-components/native";

import { useAppTheme } from "@/theme/ThemeProvider";

const ToggleSurface = styled.View`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface};
  shadow-color: #000;
  shadow-offset: 0 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`;

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
      <ToggleSurface>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={20}
          color={isDark ? "#2196F3" : "#E53935"}
        />
      </ToggleSurface>
    </Pressable>
  );
}
