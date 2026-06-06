import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { styled } from "styled-components/native";

import { KmUpdateModal } from "@/features/vehicles/components/KmUpdateModal";
import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, ScreenContent, Title } from "@/components/common/styled";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";

const CompactScreen = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: { gap: 16, padding: 20 },
  style: { backgroundColor: theme.background },
}))``;

const ActionButton = styled.Pressable<{ $primary?: boolean; $flex?: number }>`
  min-height: 48px;
  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : "")}
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border-width: ${({ $primary }) => ($primary ? 0 : 1)}px;
  border-color: ${({ theme }) => theme.border};
  background-color: ${({ $primary, theme }) => ($primary ? theme.primary : "transparent")};
  padding: 0 16px;
`;

const HistoryRow = styled(Row)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding: 12px 0;
`;

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
      <ScreenContent>
        <CompactScreen>
          <AppText $size={18} $weight={600}>
            Carregando veículo...
          </AppText>
        </CompactScreen>
      </ScreenContent>
    );
  }

  if (!vehicle) {
    return (
      <CompactScreen>
        <AppText $size={18} $weight={600}>
          Veículo não encontrado.
        </AppText>
        <ActionButton
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/vehicles")}
          $primary
        >
          <Ionicons name="car-sport-outline" size={18} color="white" />
          <AppText $color="white" $weight={700}>
            Ver frota
          </AppText>
        </ActionButton>
      </CompactScreen>
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
      <Screen>
        <Column $gap={4}>
          <Title>{vehicle.nickname}</Title>
          <AppText $color="muted">Detalhes salvos localmente neste dispositivo.</AppText>
        </Column>

        <Card $gap={16}>
          <Column $gap={4}>
            <AppText $weight={600}>Marca / Modelo / Ano</AppText>
            <AppText $size={16}>{description}</AppText>
          </Column>

          <Column $gap={4}>
            <AppText $weight={600}>Placa</AppText>
            <AppText $size={16}>{vehicle.plate}</AppText>
          </Column>

          <Column $gap={4}>
            <AppText $weight={600}>Km atual</AppText>
            <AppText $size={16}>{vehicle.currentKm.toLocaleString("pt-BR")} km</AppText>
          </Column>
        </Card>

        <ActionButton
          accessibilityRole="button"
          onPress={() => {
            setIsKmModalOpen(true);
          }}
          $primary
        >
          <Ionicons name="speedometer-outline" size={18} color="white" />
          <AppText $color="white" $weight={700}>
            Atualizar km
          </AppText>
        </ActionButton>

        <Card $gap={12}>
          <Column $gap={4}>
            <AppText $weight={600}>Histórico de km</AppText>
            <AppText $color="muted">Registros mantidos localmente com data.</AppText>
          </Column>

          {kmRecords.length === 0 ? (
            <AppText $color="muted">Nenhuma km registrada.</AppText>
          ) : (
            kmRecords.map((record) => (
              <HistoryRow key={record.id} $justify="space-between">
                <AppText>{record.km.toLocaleString("pt-BR")} km</AppText>
                <AppText $color="muted" $size={12}>
                  {new Date(record.recordedAt).toLocaleDateString("pt-BR")}
                </AppText>
              </HistoryRow>
            ))
          )}
        </Card>

        <Row $gap={12}>
          <ActionButton
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/vehicles")}
            $primary
            $flex={1}
          >
            <Ionicons name="car-sport-outline" size={18} color="white" />
            <AppText $color="white" $weight={700}>
              Ver frota
            </AppText>
          </ActionButton>

          <ActionButton
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/history")}
            $flex={1}
          >
            <Ionicons name="time-outline" size={18} color="#757575" />
            <AppText $weight={700}>Histórico</AppText>
          </ActionButton>
        </Row>
      </Screen>
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
