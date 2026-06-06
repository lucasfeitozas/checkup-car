import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "styled-components/native";

import { KmUpdateModal } from "@/features/vehicles/components/KmUpdateModal";
import { Card } from "@/components/common/Card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  AppText,
  Bullet,
  Column,
  Row,
  Screen,
  SectionTitle,
  Title,
} from "@/components/common/styled";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import type { KmPromptFrequency } from "@/features/vehicles/rules/kmReminder";

const SummaryCard = styled(Card)`
  flex: 1;
  min-height: 120px;
`;

const FrequencyButton = styled.Pressable<{ $selected: boolean }>`
  min-height: 40px;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  padding: 0 12px;
  background-color: ${({ $selected, theme }) => ($selected ? theme.primary : "transparent")};
  border-color: ${({ $selected, theme }) => ($selected ? theme.primary : theme.border)};
`;

const AlertHeader = styled(Row)<{ $active: boolean }>`
  background-color: ${({ $active, theme }) => ($active ? theme.primary : theme.muted)};
  padding: 12px 16px;
`;

const AlertBody = styled(Column)`
  padding: 12px;
`;

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const kmPromptFrequency = useVehicleStore((state) => state.kmPromptFrequency);
  const recordKm = useVehicleStore((state) => state.recordKm);
  const setKmPromptFrequency = useVehicleStore((state) => state.setKmPromptFrequency);
  const markKmPromptShown = useVehicleStore((state) => state.markKmPromptShown);
  const getVehiclesPendingKmPrompt = useVehicleStore((state) => state.getVehiclesPendingKmPrompt);
  const [promptVehicleId, setPromptVehicleId] = useState<string | null>(null);
  const totalKm = vehicles.reduce((sum, vehicle) => sum + vehicle.currentKm, 0);
  const hasVehicles = vehicles.length > 0;
  const promptVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === promptVehicleId) ?? null,
    [promptVehicleId, vehicles],
  );

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (!isHydrated || promptVehicleId) {
      return;
    }

    const [pendingVehicle] = getVehiclesPendingKmPrompt();
    if (pendingVehicle) {
      setPromptVehicleId(pendingVehicle.id);
    }
  }, [getVehiclesPendingKmPrompt, isHydrated, promptVehicleId, vehicles]);

  async function handleFrequencyChange(frequency: KmPromptFrequency) {
    try {
      await setKmPromptFrequency(frequency);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar frequência.";
      Alert.alert("Não foi possível salvar", message);
    }
  }

  async function handlePromptSubmit(km: number) {
    if (!promptVehicle) {
      return;
    }

    await recordKm(promptVehicle.id, km);
    setPromptVehicleId(null);
  }

  async function handlePromptDismiss() {
    if (!promptVehicle) {
      setPromptVehicleId(null);
      return;
    }

    try {
      await markKmPromptShown(promptVehicle.id);
      setPromptVehicleId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar lembrete.";
      Alert.alert("Não foi possível salvar", message);
    }
  }

  return (
    <>
      <Screen style={{ backgroundColor: isDark ? "#353935" : "#ECEFF1" }}>
        <Row $align="center" $justify="space-between">
          <Column $gap={4}>
            <Title>Dashboard</Title>
            <AppText $color="muted" $size={16}>
              Resumo local dos seus veículos.
            </AppText>
          </Column>
          <ThemeToggle />
        </Row>

        <Column $gap={16}>
          <SectionTitle>Resumo rápido</SectionTitle>
          <Row $gap={16}>
            <SummaryCard>
              <Column $gap={8} $flex={1}>
                <Row $gap={8}>
                  <Ionicons name="car-outline" size={18} color={isDark ? "#B0BEC5" : "#757575"} />
                  <AppText $color="muted" $size={12} $weight={500}>
                    Veículos cadastrados
                  </AppText>
                </Row>
                <AppText $size={36} $weight={700}>
                  {isHydrated ? vehicles.length : "-"}
                </AppText>
                <AppText $color="muted" $size={11}>
                  Frota registrada localmente
                </AppText>
              </Column>
            </SummaryCard>

            <SummaryCard>
              <Column $gap={8} $flex={1}>
                <Row $gap={8}>
                  <Ionicons
                    name="speedometer-outline"
                    size={18}
                    color={isDark ? "#B0BEC5" : "#757575"}
                  />
                  <AppText $color="muted" $size={12} $weight={500}>
                    Km total:
                  </AppText>
                </Row>
                <AppText $size={30} $weight={700}>
                  {isHydrated ? totalKm.toLocaleString("pt-BR") : "-"}
                </AppText>
                <AppText $color="muted" $size={11}>
                  Soma da frota local
                </AppText>
              </Column>
            </SummaryCard>
          </Row>
        </Column>

        <Column $gap={12}>
          <SectionTitle>Atualização de km</SectionTitle>
          <Card $gap={12}>
            <Column $gap={4}>
              <AppText $weight={700}>Solicitar ao abrir</AppText>
              <AppText $color="muted">
                Frequência usada para lembrar a atualização da km atual dos veículos.
              </AppText>
            </Column>
            <Row $gap={8}>
              {(["daily", "weekly"] as const).map((frequency) => {
                const isSelected = kmPromptFrequency === frequency;
                return (
                  <FrequencyButton
                    key={frequency}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      void handleFrequencyChange(frequency);
                    }}
                    $selected={isSelected}
                  >
                    <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                      {frequency === "daily" ? "Diário" : "Semanal"}
                    </AppText>
                  </FrequencyButton>
                );
              })}
            </Row>
          </Card>
        </Column>

        <Column $gap={16}>
          <Row $justify="space-between">
            <SectionTitle>Próxima revisão</SectionTitle>
            <Pressable onPress={() => router.push("/(tabs)/vehicles")}>
              <AppText $color="accent" $weight={700}>
                Ver veículos
              </AppText>
            </Pressable>
          </Row>
          <Card padded={false} style={{ overflow: "hidden" }}>
            <AlertHeader $active={hasVehicles} $gap={8}>
              <Ionicons
                name={hasVehicles ? (isDark ? "construct" : "alert-circle") : "information-circle"}
                size={20}
                color="white"
              />
              <AppText $color="white" $weight={700} $uppercase>
                {hasVehicles ? "Acompanhamento local" : "Nenhum veículo cadastrado"}
              </AppText>
            </AlertHeader>

            <AlertBody $gap={8}>
              <AppText $weight={700} $lineHeight={20}>
                {hasVehicles
                  ? "Nenhuma revisão pendente foi registrada para a frota atual."
                  : "Cadastre um veículo para acompanhar quilometragem e revisões."}
              </AppText>

              <Column $gap={6}>
                <Row $gap={8}>
                  <Bullet />
                  <AppText>
                    <AppText $weight={700}>Frota:</AppText>{" "}
                    {isHydrated ? `${vehicles.length} veículo(s)` : "Carregando..."}
                  </AppText>
                </Row>
                <Row $gap={8}>
                  <Bullet />
                  <AppText>
                    <AppText $weight={700}>Km total:</AppText>{" "}
                    {isHydrated ? `${totalKm.toLocaleString("pt-BR")} km` : "Carregando..."}
                  </AppText>
                </Row>
                <Row $gap={8}>
                  <Bullet />
                  <AppText>
                    <AppText $weight={700}>Ação recomendada:</AppText>{" "}
                    {hasVehicles
                      ? "Revise os veículos cadastrados."
                      : "Adicione o primeiro veículo."}
                  </AppText>
                </Row>
              </Column>
            </AlertBody>
          </Card>
        </Column>
      </Screen>
      <KmUpdateModal
        visible={Boolean(promptVehicle)}
        vehicle={promptVehicle}
        onSubmit={handlePromptSubmit}
        onDismiss={handlePromptDismiss}
      />
    </>
  );
}
