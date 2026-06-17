import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "styled-components/native";

import { KmUpdateModal } from "@/features/vehicles/components/KmUpdateModal";
import { Card } from "@/components/common/Card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppText, Column, Row, Screen, SectionTitle, Title } from "@/components/common/styled";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import { normalizeKmReminderPreference } from "@/features/vehicles/rules/kmReminder";
import type { MaintenanceAlertLevel } from "@/features/vehicles/rules/maintenanceEventList";
import { scheduleVehicleKmReminder } from "@/core/notifications/notifications";
import {
  buildVehicleOverview,
  type VehicleOverviewEvent,
} from "@/features/dashboard/rules/vehicleOverview";

const SummaryCard = styled(Card)`
  min-width: 104px;
  flex: 1;
  min-height: 120px;
`;

const StatGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

const AlertDot = styled.View<{ $level: MaintenanceAlertLevel }>`
  width: 9px;
  height: 9px;
  border-radius: 5px;
  background-color: ${({ $level }) => ALERT_LEVEL_COLORS[$level].dot};
`;

const FrequencyButton = styled.Pressable<{ $selected: boolean }>`
  min-height: 40px;
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

const VehicleSwitchGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const VehicleSwitchButton = styled.Pressable<{ $selected: boolean }>`
  min-height: 40px;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => ($selected ? theme.primary : theme.border)};
  background-color: ${({ $selected, theme }) => ($selected ? theme.primary : "transparent")};
  padding: 0 12px;
`;

const QuickActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const QuickActionButton = styled.Pressable<{ $primary?: boolean }>`
  min-height: 44px;
  flex-grow: 1;
  flex-basis: 142px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border-width: ${({ $primary }) => ($primary ? 0 : 1)}px;
  border-color: ${({ theme }) => theme.border};
  background-color: ${({ $primary, theme }) => ($primary ? theme.primary : "transparent")};
  padding: 0 12px;
`;

const EventRow = styled(Row)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding-top: 12px;
`;

const ReminderVehicleRow = styled(Column)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding-top: 12px;
`;

const TimeInput = styled.TextInput`
  width: 58px;
  min-height: 40px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  padding: 0 10px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.background};
`;

const ALERT_LEVEL_COLORS: Record<
  MaintenanceAlertLevel,
  { background: string; border: string; dot: string; text: string }
> = {
  neutral: {
    background: "#F5F5F5",
    border: "#D4D4D4",
    dot: "#9CA3AF",
    text: "#525252",
  },
  green: {
    background: "#ECFDF3",
    border: "#86EFAC",
    dot: "#16A34A",
    text: "#166534",
  },
  orange: {
    background: "#FFF7ED",
    border: "#FDBA74",
    dot: "#F97316",
    text: "#9A3412",
  },
  red: {
    background: "#FEF2F2",
    border: "#FCA5A5",
    dot: "#DC2626",
    text: "#991B1B",
  },
};

const STATUS_LABELS: Record<VehicleOverviewEvent["status"], string> = {
  overdue: "Vencido",
  alert: "Em alerta",
  pending: "Pendente",
};

function formatKm(value: number | undefined): string {
  return value === undefined ? "-" : `${value.toLocaleString("pt-BR")} km`;
}

function formatEventDeadline(item: VehicleOverviewEvent): string {
  const details: string[] = [];

  if (item.alert.remainingKm !== undefined) {
    if (item.alert.remainingKm <= 0) {
      details.push(`vencido por ${Math.abs(item.alert.remainingKm).toLocaleString("pt-BR")} km`);
    } else {
      details.push(`${item.alert.remainingKm.toLocaleString("pt-BR")} km restantes`);
    }
  }

  if (item.alert.remainingDays !== undefined) {
    if (item.alert.remainingDays <= 0) {
      details.push(
        `data vencida há ${Math.abs(item.alert.remainingDays).toLocaleString("pt-BR")} dia(s)`,
      );
    } else {
      details.push(`${item.alert.remainingDays.toLocaleString("pt-BR")} dia(s) restantes`);
    }
  }

  return details.join(" / ") || "Sem prazo calculável";
}

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const maintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const executionHistory = useVehicleStore((state) => state.executionHistory);
  const kmRecords = useVehicleStore((state) => state.kmRecords);
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const kmReminderPreferencesByVehicleId = useVehicleStore(
    (state) => state.kmReminderPreferencesByVehicleId,
  );
  const recordKm = useVehicleStore((state) => state.recordKm);
  const setKmReminderPreference = useVehicleStore((state) => state.setKmReminderPreference);
  const skipKmPromptUntilTomorrow = useVehicleStore((state) => state.skipKmPromptUntilTomorrow);
  const getVehiclesPendingKmPrompt = useVehicleStore((state) => state.getVehiclesPendingKmPrompt);
  const [promptVehicleId, setPromptVehicleId] = useState<string | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const hasVehicles = vehicles.length > 0;
  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? vehicles[0] ?? null,
    [activeVehicleId, vehicles],
  );
  const activeOverview = useMemo(
    () =>
      activeVehicle
        ? buildVehicleOverview({
            vehicle: activeVehicle,
            maintenanceEvents,
            executionHistory,
            kmRecords,
          })
        : null,
    [activeVehicle, executionHistory, kmRecords, maintenanceEvents],
  );
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (vehicles.length === 0) {
      setActiveVehicleId(null);
      return;
    }

    if (!activeVehicleId || !vehicles.some((vehicle) => vehicle.id === activeVehicleId)) {
      setActiveVehicleId(vehicles[0]?.id ?? null);
    }
  }, [activeVehicleId, isHydrated, vehicles]);

  async function handleReminderPreferenceChange(
    vehicleId: string,
    nextPreferenceInput: { enabled?: boolean; hour?: number; minute?: number },
  ) {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      return;
    }

    const currentPreference = normalizeKmReminderPreference(
      kmReminderPreferencesByVehicleId[vehicleId],
    );
    const nextPreference = normalizeKmReminderPreference({
      ...currentPreference,
      ...nextPreferenceInput,
    });

    try {
      const notificationId = await scheduleVehicleKmReminder({
        vehicle,
        preference: nextPreference,
        maintenanceEvents,
      });
      await setKmReminderPreference(vehicleId, {
        ...nextPreference,
        notificationId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar lembrete.";
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
      await skipKmPromptUntilTomorrow(promptVehicle.id);
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
          <SectionTitle>Veículo ativo</SectionTitle>
          {!isHydrated ? (
            <Card $gap={8}>
              <AppText $weight={700}>Carregando painel...</AppText>
              <AppText $color="muted">Buscando dados salvos localmente.</AppText>
            </Card>
          ) : !activeOverview ? (
            <Card $gap={12}>
              <Column $gap={4}>
                <AppText $weight={700}>Nenhum veículo cadastrado</AppText>
                <AppText $color="muted">
                  Cadastre um veículo para acompanhar km, eventos e alertas.
                </AppText>
              </Column>
              <QuickActionButton
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/vehicles")}
                $primary
              >
                <Ionicons name="car-sport-outline" size={18} color="white" />
                <AppText $color="white" $weight={700}>
                  Adicionar veículo
                </AppText>
              </QuickActionButton>
            </Card>
          ) : (
            <Card $gap={16}>
              <Column $gap={4}>
                <Title>{activeOverview.vehicle.nickname}</Title>
                <AppText $color="muted" $size={16}>
                  {activeOverview.modelDescription}
                </AppText>
              </Column>

              <StatGrid>
                <SummaryCard $gap={8}>
                  <AppText $color="muted" $size={12} $weight={500}>
                    Km atual
                  </AppText>
                  <AppText $size={24} $weight={700}>
                    {formatKm(activeOverview.vehicle.currentKm)}
                  </AppText>
                </SummaryCard>
                <SummaryCard $gap={8}>
                  <AppText $color="muted" $size={12} $weight={500}>
                    Km último evento
                  </AppText>
                  <AppText $size={24} $weight={700}>
                    {formatKm(activeOverview.lastEventKm)}
                  </AppText>
                </SummaryCard>
              </StatGrid>

              <StatGrid>
                <SummaryCard $gap={8}>
                  <AppText $color="muted" $size={12} $weight={500}>
                    Eventos
                  </AppText>
                  <AppText $size={30} $weight={700}>
                    {activeOverview.summary.totalEvents}
                  </AppText>
                </SummaryCard>
                <SummaryCard $gap={8}>
                  <AppText $color="muted" $size={12} $weight={500}>
                    Em alerta
                  </AppText>
                  <AppText $size={30} $weight={700}>
                    {activeOverview.summary.alertEvents}
                  </AppText>
                </SummaryCard>
                <SummaryCard $gap={8}>
                  <AppText $color="muted" $size={12} $weight={500}>
                    Vencidos
                  </AppText>
                  <AppText $size={30} $weight={700}>
                    {activeOverview.summary.overdueEvents}
                  </AppText>
                </SummaryCard>
              </StatGrid>

              <QuickActions>
                <QuickActionButton
                  accessibilityRole="button"
                  onPress={() => setPromptVehicleId(activeOverview.vehicle.id)}
                  $primary
                >
                  <Ionicons name="speedometer-outline" size={18} color="white" />
                  <AppText $color="white" $weight={700}>
                    Registrar km
                  </AppText>
                </QuickActionButton>
                <QuickActionButton
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/vehicle/[id]",
                      params: { id: activeOverview.vehicle.id },
                    })
                  }
                >
                  <Ionicons
                    name="construct-outline"
                    size={18}
                    color={isDark ? "#FFFFFF" : "#1A1A1A"}
                  />
                  <AppText $weight={700}>Adicionar evento</AppText>
                </QuickActionButton>
                <QuickActionButton
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/vehicles")}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color={isDark ? "#FFFFFF" : "#1A1A1A"}
                  />
                  <AppText $weight={700}>Trocar veículo</AppText>
                </QuickActionButton>
              </QuickActions>

              {vehicles.length > 1 ? (
                <Column $gap={8}>
                  <AppText $weight={700}>Selecionar veículo</AppText>
                  <VehicleSwitchGrid>
                    {vehicles.map((vehicle) => {
                      const isSelected = vehicle.id === activeOverview.vehicle.id;
                      return (
                        <VehicleSwitchButton
                          key={vehicle.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setActiveVehicleId(vehicle.id)}
                          $selected={isSelected}
                        >
                          <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                            {vehicle.nickname}
                          </AppText>
                        </VehicleSwitchButton>
                      );
                    })}
                  </VehicleSwitchGrid>
                </Column>
              ) : null}
            </Card>
          )}
        </Column>

        <Column $gap={12}>
          <SectionTitle>Atualização de km</SectionTitle>
          <Card $gap={12}>
            <Column $gap={4}>
              <AppText $weight={700}>Lembrete diário por veículo</AppText>
              <AppText $color="muted">
                Configure o horário da notificação local e o pedido de km ao abrir o app.
              </AppText>
            </Column>

            {!isHydrated ? (
              <AppText $color="muted">Carregando lembretes...</AppText>
            ) : vehicles.length === 0 ? (
              <AppText $color="muted">Cadastre um veículo para ativar lembretes.</AppText>
            ) : (
              vehicles.map((vehicle) => {
                const preference = normalizeKmReminderPreference(
                  kmReminderPreferencesByVehicleId[vehicle.id],
                );
                return (
                  <ReminderVehicleRow key={vehicle.id} $gap={10}>
                    <Row $justify="space-between" $gap={12}>
                      <Column $gap={2} $flex={1}>
                        <AppText $weight={700}>{vehicle.nickname}</AppText>
                        <AppText $color="muted" $size={12}>
                          {vehicle.currentKm.toLocaleString("pt-BR")} km atuais
                        </AppText>
                      </Column>
                      <FrequencyButton
                        accessibilityRole="button"
                        accessibilityState={{ selected: preference.enabled }}
                        onPress={() => {
                          void handleReminderPreferenceChange(vehicle.id, {
                            enabled: !preference.enabled,
                          });
                        }}
                        $selected={preference.enabled}
                      >
                        <AppText $color={preference.enabled ? "white" : "text"} $weight={700}>
                          {preference.enabled ? "Ativo" : "Inativo"}
                        </AppText>
                      </FrequencyButton>
                    </Row>
                    <Row $gap={8}>
                      <Column $gap={4}>
                        <AppText $color="muted" $size={12}>
                          Hora
                        </AppText>
                        <TimeInput
                          value={String(preference.hour).padStart(2, "0")}
                          editable={preference.enabled}
                          keyboardType="number-pad"
                          maxLength={2}
                          onChangeText={(value) => {
                            const hour = Number.parseInt(value.replace(/\D/g, ""), 10);
                            if (!Number.isNaN(hour)) {
                              void handleReminderPreferenceChange(vehicle.id, { hour });
                            }
                          }}
                        />
                      </Column>
                      <Column $gap={4}>
                        <AppText $color="muted" $size={12}>
                          Min
                        </AppText>
                        <TimeInput
                          value={String(preference.minute).padStart(2, "0")}
                          editable={preference.enabled}
                          keyboardType="number-pad"
                          maxLength={2}
                          onChangeText={(value) => {
                            const minute = Number.parseInt(value.replace(/\D/g, ""), 10);
                            if (!Number.isNaN(minute)) {
                              void handleReminderPreferenceChange(vehicle.id, { minute });
                            }
                          }}
                        />
                      </Column>
                    </Row>
                  </ReminderVehicleRow>
                );
              })
            )}
          </Card>
        </Column>

        <Column $gap={16}>
          <Row $justify="space-between">
            <SectionTitle>Próximos eventos</SectionTitle>
            <Pressable onPress={() => router.push("/(tabs)/vehicles")}>
              <AppText $color="accent" $weight={700}>
                Ver detalhes
              </AppText>
            </Pressable>
          </Row>
          <Card padded={false} style={{ overflow: "hidden" }}>
            <AlertHeader $active={Boolean(activeOverview)} $gap={8}>
              <Ionicons
                name={hasVehicles ? (isDark ? "construct" : "alert-circle") : "information-circle"}
                size={20}
                color="white"
              />
              <AppText $color="white" $weight={700} $uppercase>
                {activeOverview ? activeOverview.vehicle.nickname : "Nenhum veículo cadastrado"}
              </AppText>
            </AlertHeader>

            <AlertBody $gap={12}>
              {!activeOverview ? (
                <AppText $color="muted">
                  Cadastre um veículo para acompanhar manutenções pendentes.
                </AppText>
              ) : activeOverview.upcomingEvents.length === 0 ? (
                <AppText $color="muted">Nenhum evento cadastrado para o veículo ativo.</AppText>
              ) : (
                activeOverview.upcomingEvents.slice(0, 5).map((item) => {
                  const color = ALERT_LEVEL_COLORS[item.alert.level].text;
                  return (
                    <EventRow
                      key={item.event.id}
                      $align="flex-start"
                      $justify="space-between"
                      $gap={12}
                    >
                      <Column $gap={5} $flex={1}>
                        <AppText $weight={700}>{item.event.name}</AppText>
                        <Row $gap={6}>
                          <AlertDot $level={item.alert.level} />
                          <AppText style={{ color }} $size={12} $weight={700}>
                            {STATUS_LABELS[item.status]}
                          </AppText>
                        </Row>
                        <AppText $color="muted" $size={12}>
                          {formatEventDeadline(item)}
                        </AppText>
                      </Column>
                      <Column $gap={4}>
                        <AppText $weight={700}>{formatKm(item.event.nextKm)}</AppText>
                        <AppText $color="muted" $size={12}>
                          {item.event.nextDate
                            ? new Date(item.event.nextDate).toLocaleDateString("pt-BR")
                            : "Sem data"}
                        </AppText>
                      </Column>
                    </EventRow>
                  );
                })
              )}
            </AlertBody>
          </Card>
        </Column>
      </Screen>
      <KmUpdateModal
        visible={Boolean(promptVehicle)}
        vehicle={promptVehicle}
        onSubmit={handlePromptSubmit}
        onDismiss={handlePromptDismiss}
        dismissLabel="Pular para amanhã"
      />
    </>
  );
}
