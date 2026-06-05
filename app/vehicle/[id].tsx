import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehicleDetailsScreen() {
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
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5">
        <Text className="text-lg font-semibold text-text">Veículo não encontrado.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <Text className="text-3xl font-bold text-text">{vehicle.nickname}</Text>
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
    </ScrollView>
  );
}
