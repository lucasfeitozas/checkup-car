import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useAppTheme } from "@/theme/ThemeProvider";

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName) {
  return function Icon({ color, size }: { color: string; size: number }) {
    return (
      <Ionicons
        accessibilityElementsHidden
        color={color}
        importantForAccessibility="no"
        name={name}
        size={size}
      />
    );
  };
}

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 18,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          elevation: 0,
          height: 82,
          borderTopWidth: 1,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          minHeight: 58,
        },
        tabBarLabelStyle: {
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: tabIcon("speedometer-outline"),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Veículos",
          tabBarAccessibilityLabel: "Veículos",
          tabBarIcon: tabIcon("car-sport-outline"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarAccessibilityLabel: "Histórico",
          tabBarIcon: tabIcon("time-outline"),
        }}
      />
    </Tabs>
  );
}
