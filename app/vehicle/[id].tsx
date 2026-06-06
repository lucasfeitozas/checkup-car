import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { KmUpdateModal } from "@/components/features/KmUpdateModal";
import { Card } from "@/components/ui/Card";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const recordKm = useVehicleStore((state) => state.recordKm);
  const vehicle = useVehicleStore((state) =>
    typeof id === "string" ? state.vehicles.find((item) => item.id === id) : undefined,
  );
  const allKmRecords = useVehicleStore((state) => state.kmRecords);
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);

  const description = vehicle
    ? [vehicle.brand, vehicle.model, String(vehicle.year)].filter(Boolean).join(" ")
    : "";
  const kmRecords = useMemo(
    () =>
      typeof id === "string"
        ? allKmRecords
            .filter((record) => record.vehicleId === id)
            .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
        : [],
    [allKmRecords, id],
  );

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

  async function handleKmSubmit(km: number) {
    if (!vehicle) {
      return;
    }

    await recordKm(vehicle.id, km);
    setIsKmModalOpen(false);
  }

  return (
    <>
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

        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 active:opacity-80"
          onPress={() => {
            setIsKmModalOpen(true);
          }}
        >
          <Ionicons name="speedometer-outline" size={18} color="white" />
          <Text className="font-jakarta text-sm font-bold text-white">Atualizar km</Text>
        </Pressable>

        <Card className="gap-3 p-4">
          <View className="gap-1">
            <Text className="text-sm font-semibold text-text">Histórico de km</Text>
            <Text className="text-sm text-muted">Registros mantidos localmente com data.</Text>
          </View>

          {kmRecords.length === 0 ? (
            <Text className="text-sm text-muted">Nenhuma km registrada.</Text>
          ) : (
            kmRecords.map((record) => (
              <View
                key={record.id}
                className="flex-row items-center justify-between border-t border-border py-3"
              >
                <Text className="font-jakarta text-sm text-text">
                  {record.km.toLocaleString("pt-BR")} km
                </Text>
                <Text className="font-jakarta text-xs text-muted">
                  {new Date(record.recordedAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ))
          )}
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
      <KmUpdateModal
        visible={isKmModalOpen}
        vehicle={vehicle}
        onSubmit={handleKmSubmit}
        onDismiss={() => {
          setIsKmModalOpen(false);
        }}
      />
    </>
  );
}
