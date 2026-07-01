import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal } from "react-native";
import { styled } from "styled-components/native";

import { KmUpdateModal } from "@/features/vehicles/components/KmUpdateModal";
import { MaintenanceEventEditModal } from "@/features/vehicles/components/MaintenanceEventEditModal";
import { MaintenanceExecutionModal } from "@/features/vehicles/components/MaintenanceExecutionModal";
import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, ScreenContent, Title } from "@/components/common/styled";
import { type MaintenanceEvent, useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import {
  calculateMaintenanceSchedule,
  formatBrazilianDateInput,
  MAINTENANCE_EVENT_TYPES,
  maskBrazilianDateInput,
  type MaintenanceEventTypeId,
  validateBrazilianFutureDateInput,
  validateBrazilianPastOrTodayDateInput,
} from "@/features/vehicles/rules/maintenanceEvents";
import {
  filterMaintenanceEvents,
  getMaintenanceAlert,
  sortMaintenanceEvents,
  type MaintenanceEventFilter,
  type MaintenanceEventSort,
  type MaintenanceAlertLevel,
} from "@/features/vehicles/rules/maintenanceEventList";

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

const ExecuteButton = styled.Pressable`
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.primary};
  padding: 0 12px;
`;

const EventActionButton = styled.Pressable<{ $danger?: boolean }>`
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ $danger, theme }) => ($danger ? theme.primary : theme.border)};
  padding: 0 12px;
`;

const PreferencesGroup = styled.View`
  gap: 8px;
`;

const PreferencesOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const PreferenceButton = styled.Pressable<{ $selected: boolean }>`
  min-height: 40px;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => ($selected ? theme.primary : theme.border)};
  background-color: ${({ $selected, theme }) => ($selected ? theme.primary : "transparent")};
  padding: 0 12px;
`;

const AlertBadge = styled(Row)<{ $level: MaintenanceAlertLevel }>`
  align-self: flex-start;
  border-radius: 999px;
  border-width: 1px;
  border-color: ${({ $level }) => ALERT_LEVEL_COLORS[$level].border};
  background-color: ${({ $level }) => ALERT_LEVEL_COLORS[$level].background};
  padding: 5px 9px;
`;

const AlertDot = styled.View<{ $level: MaintenanceAlertLevel }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ $level }) => ALERT_LEVEL_COLORS[$level].dot};
`;

const RightColumn = styled(Column)`
  align-items: flex-end;
`;

const ModalOverlay = styled.View`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.4);
`;

const Backdrop = styled.Pressable`
  position: absolute;
  inset: 0;
`;

const Sheet = styled.View`
  max-height: 92%;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  background-color: ${({ theme }) => theme.background};
`;

const SheetHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CloseButton = styled.Pressable`
  min-height: 40px;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  padding: 0 12px;
`;

const FormScroll = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 12, paddingBottom: 16 },
  keyboardShouldPersistTaps: "handled" as const,
})`
  margin-top: 16px;
`;

const Field = styled(Column)`
  gap: 8px;
`;

const FieldInput = styled.TextInput<{ $hasError?: boolean }>`
  min-height: 48px;
  border-radius: 8px;
  border-width: 1px;
  padding: 0 16px;
  background-color: ${({ theme }) => theme.background};
  border-color: ${({ $hasError, theme }) => ($hasError ? theme.primary : theme.border)};
  color: ${({ theme }) => theme.text};
`;

const TypeOption = styled.Pressable<{ $selected: boolean }>`
  min-height: 44px;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  padding: 0 12px;
  background-color: ${({ $selected, theme }) => ($selected ? theme.primary : "transparent")};
  border-color: ${({ $selected, theme }) => ($selected ? theme.primary : theme.border)};
`;

const Footer = styled.View`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding-top: 12px;
  background-color: ${({ theme }) => theme.background};
`;

const SubmitButton = styled.Pressable<{ disabled?: boolean }>`
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 20px;
  background-color: ${({ theme }) => theme.primary};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

function formatMaintenanceDate(value?: string): string {
  if (!value) {
    return "Sem data limite";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

const SORT_OPTIONS: { value: MaintenanceEventSort; label: string }[] = [
  { value: "next-km", label: "Próxima km" },
  { value: "next-date", label: "Próxima data" },
  { value: "name", label: "Nome A-Z" },
];

const FILTER_OPTIONS: { value: MaintenanceEventFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "alert", label: "Em alerta" },
  { value: "overdue", label: "Vencidos" },
  { value: "completed", label: "Concluídos" },
];

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

const ALERT_LABELS: Record<MaintenanceAlertLevel, string> = {
  neutral: "Neutro",
  green: "Verde",
  orange: "Laranja",
  red: "Vermelho",
};

function formatAlertDetail(event: MaintenanceEvent, currentKm: number): string {
  const alert = getMaintenanceAlert(event, currentKm);

  if (alert.remainingKm !== undefined && alert.remainingKm <= 0) {
    return "Manutenção vencida por km";
  }

  if (alert.remainingDays !== undefined && alert.remainingDays <= 0) {
    return "Data limite vencida";
  }

  const details: string[] = [];
  if (alert.remainingKm !== undefined) {
    details.push(`${alert.remainingKm.toLocaleString("pt-BR")} km restantes`);
  }
  if (alert.remainingDays !== undefined) {
    details.push(`${alert.remainingDays.toLocaleString("pt-BR")} dia(s) restantes`);
  }

  return details.join(" / ") || "Sem prazo calculável";
}

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const recordKm = useVehicleStore((state) => state.recordKm);
  const addMaintenanceEvent = useVehicleStore((state) => state.addMaintenanceEvent);
  const createCustomMaintenanceEvent = useVehicleStore(
    (state) => state.createCustomMaintenanceEvent,
  );
  const addCustomMaintenanceEvent = useVehicleStore((state) => state.addCustomMaintenanceEvent);
  const executeMaintenanceEvent = useVehicleStore((state) => state.executeMaintenanceEvent);
  const updateMaintenanceEvent = useVehicleStore((state) => state.updateMaintenanceEvent);
  const deleteMaintenanceEvent = useVehicleStore((state) => state.deleteMaintenanceEvent);
  const maintenanceEventSort = useVehicleStore((state) => state.maintenanceEventSort);
  const maintenanceEventFilter = useVehicleStore((state) => state.maintenanceEventFilter);
  const setMaintenanceEventSort = useVehicleStore((state) => state.setMaintenanceEventSort);
  const setMaintenanceEventFilter = useVehicleStore((state) => state.setMaintenanceEventFilter);
  const customMaintenanceTypes = useVehicleStore((state) => state.customMaintenanceTypes);
  const vehicle = useVehicleStore((state) =>
    typeof id === "string" ? state.vehicles.find((item) => item.id === id) : undefined,
  );
  const allKmRecords = useVehicleStore((state) => state.kmRecords);
  const allMaintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const executionHistory = useVehicleStore((state) => state.executionHistory);
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [executionEvent, setExecutionEvent] = useState<MaintenanceEvent | undefined>();
  const [editingEvent, setEditingEvent] = useState<MaintenanceEvent | undefined>();
  const [selectedTypeId, setSelectedTypeId] =
    useState<MaintenanceEventTypeId>("alignment-balancing");
  const [customName, setCustomName] = useState("");
  const [intervalKm, setIntervalKm] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("");
  const [lastExecutionKm, setLastExecutionKm] = useState("");
  const [lastExecutionDate, setLastExecutionDate] = useState("");
  const [nextKm, setNextKm] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

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
  const maintenanceEvents = useMemo(() => {
    if (typeof id !== "string" || !vehicle) {
      return [];
    }

    const vehicleEvents = allMaintenanceEvents.filter((event) => event.vehicleId === id);
    const filtered = filterMaintenanceEvents(
      vehicleEvents,
      [vehicle],
      executionHistory,
      maintenanceEventFilter,
    );
    return sortMaintenanceEvents(filtered, [vehicle], maintenanceEventSort);
  }, [
    allMaintenanceEvents,
    executionHistory,
    id,
    maintenanceEventFilter,
    maintenanceEventSort,
    vehicle,
  ]);
  const selectedCustomType = customMaintenanceTypes.find((type) => type.id === selectedTypeId);

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

  function applyMaintenanceType(typeId: MaintenanceEventTypeId) {
    setSelectedTypeId(typeId);
    setMaintenanceError(null);

    if (!vehicle) {
      return;
    }

    const isReusableCustomType = typeId.startsWith("custom-");
    const schedule = isReusableCustomType
      ? {}
      : calculateMaintenanceSchedule(typeId, vehicle.currentKm);
    setNextKm(schedule.nextKm === undefined ? "" : String(schedule.nextKm));
    setNextDate(formatBrazilianDateInput(schedule.nextDate));
    setLastExecutionKm("");
    setLastExecutionDate("");

    if (typeId !== "custom") {
      setCustomName("");
      setIntervalKm("");
      setIntervalMonths("");
    }
  }

  function openMaintenanceModal() {
    setCustomName("");
    setIntervalKm("");
    setIntervalMonths("");
    setLastExecutionKm("");
    setLastExecutionDate("");
    setNextKm("");
    setNextDate("");
    setMaintenanceError(null);
    setIsMaintenanceModalOpen(true);
    applyMaintenanceType(selectedTypeId);
  }

  function closeMaintenanceModal() {
    setIsMaintenanceModalOpen(false);
    setMaintenanceError(null);
    setIsSavingMaintenance(false);
  }

  async function handleMaintenanceSubmit() {
    if (!vehicle) {
      return;
    }

    const isCreatingCustomType = selectedTypeId === "custom";

    if (isCreatingCustomType || selectedCustomType) {
      const parsedIntervalKm = intervalKm.trim()
        ? Number.parseInt(intervalKm, 10)
        : selectedCustomType?.intervalKm;
      const parsedIntervalMonths = intervalMonths.trim()
        ? Number.parseInt(intervalMonths, 10)
        : selectedCustomType?.intervalMonths;
      const parsedLastExecutionKm = lastExecutionKm.trim()
        ? Number.parseInt(lastExecutionKm, 10)
        : undefined;
      const parsedLastExecutionDateResult = lastExecutionDate.trim()
        ? validateBrazilianPastOrTodayDateInput(lastExecutionDate)
        : undefined;

      if (parsedLastExecutionDateResult && !parsedLastExecutionDateResult.isValid) {
        setMaintenanceError(parsedLastExecutionDateResult.message);
        return;
      }

      try {
        setIsSavingMaintenance(true);
        if (isCreatingCustomType) {
          await createCustomMaintenanceEvent(vehicle.id, {
            name: customName,
            intervalKm: parsedIntervalKm,
            intervalMonths: parsedIntervalMonths,
            lastExecutionKm: parsedLastExecutionKm,
            lastExecutionDate: parsedLastExecutionDateResult?.date.toISOString(),
          });
        } else if (selectedCustomType) {
          await addCustomMaintenanceEvent(vehicle.id, selectedCustomType.id, {
            lastExecutionKm: parsedLastExecutionKm,
            lastExecutionDate: parsedLastExecutionDateResult?.date.toISOString(),
          });
        }
        closeMaintenanceModal();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro inesperado ao salvar manutenção.";
        setMaintenanceError(message);
        Alert.alert("Não foi possível salvar", message);
      } finally {
        setIsSavingMaintenance(false);
      }
      return;
    }

    const parsedNextKm = nextKm.trim() ? Number.parseInt(nextKm, 10) : undefined;
    if (nextKm.trim() && (parsedNextKm === undefined || Number.isNaN(parsedNextKm))) {
      setMaintenanceError("Informe uma próxima km válida.");
      return;
    }

    if (parsedNextKm === undefined && !nextDate.trim()) {
      setMaintenanceError("Informe a próxima km ou a data limite da manutenção.");
      return;
    }

    const parsedNextDateResult = nextDate.trim()
      ? validateBrazilianFutureDateInput(nextDate)
      : undefined;
    if (parsedNextDateResult && !parsedNextDateResult.isValid) {
      setMaintenanceError(parsedNextDateResult.message);
      return;
    }

    try {
      setIsSavingMaintenance(true);
      await addMaintenanceEvent(vehicle.id, {
        typeId: selectedTypeId,
        customName,
        nextKm: parsedNextKm,
        nextDate: parsedNextDateResult?.date.toISOString(),
      });
      closeMaintenanceModal();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar manutenção.";
      setMaintenanceError(message);
      Alert.alert("Não foi possível salvar", message);
    } finally {
      setIsSavingMaintenance(false);
    }
  }

  function confirmDeleteMaintenance(event: MaintenanceEvent) {
    Alert.alert(
      "Excluir manutenção",
      `Deseja excluir "${event.name}"? Esta ação é irreversível e também remove o histórico de execuções deste evento.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteMaintenanceEvent(event.id).catch((e: unknown) => {
              const message =
                e instanceof Error ? e.message : "Erro inesperado ao excluir manutenção.";
              Alert.alert("Não foi possível excluir", message);
            });
          },
        },
      ],
    );
  }

  async function handleSortChange(sort: MaintenanceEventSort) {
    try {
      await setMaintenanceEventSort(sort);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar ordenação.";
      Alert.alert("Não foi possível salvar", message);
    }
  }

  async function handleFilterChange(filter: MaintenanceEventFilter) {
    try {
      await setMaintenanceEventFilter(filter);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar filtro.";
      Alert.alert("Não foi possível salvar", message);
    }
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

        <ActionButton accessibilityRole="button" onPress={openMaintenanceModal} $primary>
          <Ionicons name="construct-outline" size={18} color="white" />
          <AppText $color="white" $weight={700}>
            Adicionar manutenção
          </AppText>
        </ActionButton>

        <Card $gap={12}>
          <Column $gap={4}>
            <AppText $weight={600}>Manutenções cadastradas</AppText>
            <AppText $color="muted">Eventos e prazos salvos localmente para este veículo.</AppText>
          </Column>

          <PreferencesGroup>
            <AppText $weight={600}>Ordenar por</AppText>
            <PreferencesOptions>
              {SORT_OPTIONS.map((option) => {
                const isSelected = maintenanceEventSort === option.value;
                return (
                  <PreferenceButton
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      void handleSortChange(option.value);
                    }}
                    $selected={isSelected}
                  >
                    <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                      {option.label}
                    </AppText>
                  </PreferenceButton>
                );
              })}
            </PreferencesOptions>
          </PreferencesGroup>

          <PreferencesGroup>
            <AppText $weight={600}>Filtrar por status</AppText>
            <PreferencesOptions>
              {FILTER_OPTIONS.map((option) => {
                const isSelected = maintenanceEventFilter === option.value;
                return (
                  <PreferenceButton
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      void handleFilterChange(option.value);
                    }}
                    $selected={isSelected}
                  >
                    <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                      {option.label}
                    </AppText>
                  </PreferenceButton>
                );
              })}
            </PreferencesOptions>
          </PreferencesGroup>

          {maintenanceEvents.length === 0 ? (
            <AppText $color="muted">
              {allMaintenanceEvents.some((event) => event.vehicleId === vehicle.id)
                ? "Nenhuma manutenção encontrada para o filtro selecionado."
                : "Nenhuma manutenção cadastrada."}
            </AppText>
          ) : (
            maintenanceEvents.map((event) => {
              const alert = getMaintenanceAlert(event, vehicle.currentKm);
              const alertTextColor = ALERT_LEVEL_COLORS[alert.level].text;

              return (
                <HistoryRow key={event.id} $align="flex-start" $justify="space-between">
                  <Column $gap={6} $flex={1}>
                    <AppText $weight={700}>{event.name}</AppText>
                    <AlertBadge $level={alert.level} $gap={6}>
                      <AlertDot $level={alert.level} />
                      <AppText style={{ color: alertTextColor }} $size={12} $weight={700}>
                        {ALERT_LABELS[alert.level]}
                      </AppText>
                    </AlertBadge>
                    <AppText $color="muted" $size={12}>
                      {formatAlertDetail(event, vehicle.currentKm)}
                    </AppText>
                    <AppText $color="muted" $size={12}>
                      Criada em {new Date(event.createdAt).toLocaleDateString("pt-BR")}
                    </AppText>
                  </Column>
                  <RightColumn $gap={8}>
                    <AppText $weight={600}>
                      {event.nextKm === undefined
                        ? "Sem km"
                        : `${event.nextKm.toLocaleString("pt-BR")} km`}
                    </AppText>
                    <AppText $color="muted" $size={12}>
                      {formatMaintenanceDate(event.nextDate)}
                    </AppText>
                    <ExecuteButton
                      accessibilityLabel={`Efetuar ${event.name}`}
                      accessibilityRole="button"
                      onPress={() => {
                        setExecutionEvent(event);
                      }}
                    >
                      <AppText $color="white" $weight={700}>
                        Efetuar
                      </AppText>
                    </ExecuteButton>
                    <EventActionButton
                      accessibilityLabel={`Ver histórico de ${event.name}`}
                      accessibilityRole="button"
                      onPress={() => {
                        router.push({
                          pathname: "/maintenance/[id]/history",
                          params: { id: event.id },
                        });
                      }}
                    >
                      <AppText $weight={700}>Histórico</AppText>
                    </EventActionButton>
                    <Row $gap={8}>
                      <EventActionButton
                        accessibilityLabel={`Editar ${event.name}`}
                        accessibilityRole="button"
                        onPress={() => {
                          setEditingEvent(event);
                        }}
                      >
                        <AppText $weight={700}>Editar</AppText>
                      </EventActionButton>
                      <EventActionButton
                        $danger
                        accessibilityLabel={`Excluir ${event.name}`}
                        accessibilityRole="button"
                        onPress={() => {
                          confirmDeleteMaintenance(event);
                        }}
                      >
                        <AppText $color="primary" $weight={700}>
                          Excluir
                        </AppText>
                      </EventActionButton>
                    </Row>
                  </RightColumn>
                </HistoryRow>
              );
            })
          )}
        </Card>

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
            onPress={() =>
              router.push({ pathname: "/vehicle/[id]/history", params: { id: vehicle.id } })
            }
            $flex={1}
          >
            <Ionicons name="time-outline" size={18} color="#757575" />
            <AppText $weight={700}>Dossiê</AppText>
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
      <MaintenanceExecutionModal
        event={executionEvent}
        onDismiss={() => {
          setExecutionEvent(undefined);
        }}
        onSubmit={async (input) => {
          if (!executionEvent) {
            return;
          }
          await executeMaintenanceEvent(executionEvent.id, input);
        }}
        vehicle={vehicle}
        visible={Boolean(executionEvent)}
      />
      <MaintenanceEventEditModal
        customMaintenanceTypes={customMaintenanceTypes}
        event={editingEvent}
        onDismiss={() => {
          setEditingEvent(undefined);
        }}
        onSubmit={async (input) => {
          if (!editingEvent) {
            return;
          }
          await updateMaintenanceEvent(editingEvent.id, input);
        }}
        vehicle={vehicle}
        visible={Boolean(editingEvent)}
      />
      <Modal
        transparent
        animationType="slide"
        visible={isMaintenanceModalOpen}
        onRequestClose={closeMaintenanceModal}
      >
        <ModalOverlay>
          <Backdrop onPress={closeMaintenanceModal} />
          <Sheet>
            <SheetHeader>
              <Column $gap={4} $flex={1}>
                <AppText $size={18} $weight={700}>
                  Cadastrar manutenção
                </AppText>
                <AppText $color="muted">Selecione um tipo e ajuste os prazos.</AppText>
              </Column>
              <CloseButton
                accessibilityLabel="Fechar cadastro de manutenção"
                accessibilityRole="button"
                onPress={closeMaintenanceModal}
              >
                <AppText $weight={700}>Fechar</AppText>
              </CloseButton>
            </SheetHeader>

            <FormScroll>
              <Field>
                <AppText $weight={600}>Tipo de manutenção</AppText>
                <Column $gap={8}>
                  {MAINTENANCE_EVENT_TYPES.map((type) => {
                    const isSelected = selectedTypeId === type.id;
                    return (
                      <TypeOption
                        key={type.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => {
                          applyMaintenanceType(type.id);
                        }}
                        $selected={isSelected}
                      >
                        <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                          {type.name}
                        </AppText>
                      </TypeOption>
                    );
                  })}
                  {customMaintenanceTypes.map((type) => {
                    const isSelected = selectedTypeId === type.id;
                    return (
                      <TypeOption
                        key={type.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => {
                          applyMaintenanceType(type.id);
                        }}
                        $selected={isSelected}
                      >
                        <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                          {type.name}
                        </AppText>
                        <AppText $color={isSelected ? "white" : "muted"} $size={12}>
                          Personalizada
                        </AppText>
                      </TypeOption>
                    );
                  })}
                </Column>
              </Field>

              {selectedTypeId === "custom" ? (
                <>
                  <Field>
                    <AppText $weight={600}>Nome da manutenção</AppText>
                    <FieldInput
                      value={customName}
                      onChangeText={(value) => {
                        setCustomName(value);
                        setMaintenanceError(null);
                      }}
                      accessibilityLabel="Nome da manutenção personalizada"
                      maxLength={80}
                      placeholder="Ex: Troca de correia auxiliar"
                      placeholderTextColor="#757575"
                      $hasError={Boolean(maintenanceError && !customName.trim())}
                    />
                  </Field>
                  <Field>
                    <AppText $weight={600}>Intervalo em km</AppText>
                    <FieldInput
                      value={intervalKm}
                      onChangeText={(value) => {
                        setIntervalKm(value.replace(/\D/g, "").slice(0, 9));
                        setMaintenanceError(null);
                      }}
                      accessibilityLabel="Intervalo da manutenção em quilômetros"
                      keyboardType="number-pad"
                      maxLength={9}
                      placeholder="Opcional"
                      placeholderTextColor="#757575"
                    />
                  </Field>
                  <Field>
                    <AppText $weight={600}>Intervalo em meses</AppText>
                    <FieldInput
                      value={intervalMonths}
                      onChangeText={(value) => {
                        setIntervalMonths(value.replace(/\D/g, "").slice(0, 4));
                        setMaintenanceError(null);
                      }}
                      accessibilityLabel="Intervalo da manutenção em meses"
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="Opcional"
                      placeholderTextColor="#757575"
                    />
                  </Field>
                </>
              ) : null}

              {selectedTypeId === "custom" || selectedCustomType ? (
                <>
                  {(
                    selectedTypeId === "custom"
                      ? Boolean(intervalKm.trim())
                      : selectedCustomType?.intervalKm !== undefined
                  ) ? (
                    <Field>
                      <AppText $weight={600}>Km da última execução</AppText>
                      <FieldInput
                        value={lastExecutionKm}
                        onChangeText={(value) => {
                          setLastExecutionKm(value.replace(/\D/g, "").slice(0, 9));
                          setMaintenanceError(null);
                        }}
                        accessibilityLabel="Quilometragem da última execução"
                        keyboardType="number-pad"
                        maxLength={9}
                        placeholder={`Até ${vehicle.currentKm.toLocaleString("pt-BR")} km`}
                        placeholderTextColor="#757575"
                      />
                    </Field>
                  ) : null}
                  {(
                    selectedTypeId === "custom"
                      ? Boolean(intervalMonths.trim())
                      : selectedCustomType?.intervalMonths !== undefined
                  ) ? (
                    <Field>
                      <AppText $weight={600}>Data da última execução</AppText>
                      <FieldInput
                        value={lastExecutionDate}
                        onChangeText={(value) => {
                          setLastExecutionDate(maskBrazilianDateInput(value));
                          setMaintenanceError(null);
                        }}
                        accessibilityHint="Use o formato DD/MM/AAAA."
                        accessibilityLabel="Data da última execução"
                        maxLength={10}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#757575"
                      />
                    </Field>
                  ) : null}
                </>
              ) : (
                <>
                  <Field>
                    <AppText $weight={600}>Próxima km</AppText>
                    <FieldInput
                      value={nextKm}
                      onChangeText={(value) => {
                        setNextKm(value.replace(/\D/g, "").slice(0, 9));
                        setMaintenanceError(null);
                      }}
                      accessibilityLabel="Próxima quilometragem da manutenção"
                      keyboardType="number-pad"
                      maxLength={9}
                      placeholder="Opcional"
                      placeholderTextColor="#757575"
                    />
                  </Field>

                  <Field>
                    <AppText $weight={600}>Data limite</AppText>
                    <FieldInput
                      value={nextDate}
                      onChangeText={(value) => {
                        setNextDate(maskBrazilianDateInput(value));
                        setMaintenanceError(null);
                      }}
                      accessibilityHint="Use o formato DD/MM/AAAA."
                      accessibilityLabel="Data limite da manutenção"
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#757575"
                    />
                  </Field>
                </>
              )}
            </FormScroll>

            <Footer>
              {maintenanceError ? (
                <AppText $color="primary" $weight={600} style={{ marginBottom: 8 }}>
                  {maintenanceError}
                </AppText>
              ) : null}
              <SubmitButton
                accessibilityRole="button"
                accessibilityState={{ disabled: isSavingMaintenance }}
                disabled={isSavingMaintenance}
                onPress={handleMaintenanceSubmit}
              >
                <AppText $color="white" $size={16} $weight={700}>
                  Salvar manutenção
                </AppText>
              </SubmitButton>
            </Footer>
          </Sheet>
        </ModalOverlay>
      </Modal>
    </>
  );
}
