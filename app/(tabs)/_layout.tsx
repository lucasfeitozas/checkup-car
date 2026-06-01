import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useAppTheme } from "@/components/ThemeProvider";

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName) {
  return function Icon({ color, size }: { color: string; size: number }) {
    return <Ionicons color={color} name={name} size={size} />;
  };
}

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
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
          title: "Veiculos",
          tabBarIcon: tabIcon("car-sport-outline"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historico",
          tabBarIcon: tabIcon("time-outline"),
        }}
      />
    </Tabs>
  );
}
