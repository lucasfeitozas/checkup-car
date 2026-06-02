import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const vehicle = useVehicleStore((state) => state.vehicles.find((item) => item.id === id));
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
      <Card className="gap-2">
        <Text className="text-base text-text">{description}</Text>
        <Text className="text-sm text-muted">Placa {vehicle.plate}</Text>
        <Text className="text-sm text-muted">{vehicle.currentKm.toLocaleString("pt-BR")} km</Text>
      </Card>
    </ScrollView>
  );
}
