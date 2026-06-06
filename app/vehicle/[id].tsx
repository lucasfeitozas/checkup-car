import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const vehicle = useVehicleStore((state) =>
    typeof id === "string" ? state.vehicles.find((item) => item.id === id) : undefined,
  );

  const description = vehicle
    ? [vehicle.brand, vehicle.model, String(vehicle.year)].filter(Boolean).join(" ")
    : "";

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  if (!isHydrated) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5">
        <Text className="text-lg font-semibold text-text">Carregando veículo...</Text>
      </ScrollView>
    );
  }

  if (!vehicle) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
        <Text className="text-lg font-semibold text-text">Veículo não encontrado.</Text>
        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 active:opacity-80"
          onPress={() => router.push("/(tabs)/vehicles")}
        >
          <Ionicons name="car-sport-outline" size={18} color="white" />
          <Text className="font-jakarta text-sm font-bold text-white">Ver frota</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <View className="gap-1">
        <Text className="text-3xl font-bold text-text">{vehicle.nickname}</Text>
        <Text className="text-sm text-muted">Detalhes salvos localmente neste dispositivo.</Text>
      </View>

      <Card className="gap-4 p-4">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-text">Marca / Modelo / Ano</Text>
          <Text className="text-base text-text">{description}</Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-semibold text-text">Placa</Text>
          <Text className="text-base text-text">{vehicle.plate}</Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-semibold text-text">Km atual</Text>
          <Text className="text-base text-text">
            {vehicle.currentKm.toLocaleString("pt-BR")} km
          </Text>
        </View>
      </Card>

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 active:opacity-80"
          onPress={() => router.push("/(tabs)/vehicles")}
        >
          <Ionicons name="car-sport-outline" size={18} color="white" />
          <Text className="font-jakarta text-sm font-bold text-white">Ver frota</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-border px-4 active:opacity-80"
          onPress={() => router.push("/(tabs)/history")}
        >
          <Ionicons name="time-outline" size={18} color="#757575" />
          <Text className="font-jakarta text-sm font-bold text-text">Histórico</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
