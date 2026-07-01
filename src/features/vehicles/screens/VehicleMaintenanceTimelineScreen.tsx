import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { styled } from "styled-components/native";

import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, Title } from "@/components/common/styled";
import {
  maskBrazilianDateInput,
  validateBrazilianPastOrTodayDateInput,
} from "@/features/vehicles/rules/maintenanceEvents";
import { buildVehicleMaintenanceTimeline } from "@/features/vehicles/rules/vehicleMaintenanceTimeline";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";

const ActionButton = styled.Pressable<{ $primary?: boolean; $flex?: number }>`
  min-height: 44px;
  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : "")}
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

const FilterOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const FilterButton = styled.Pressable<{ $selected: boolean }>`
  min-height: 40px;
  justify-content: center;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ $selected, theme }) => ($selected ? theme.primary : theme.border)};
  background-color: ${({ $selected, theme }) => ($selected ? theme.primary : "transparent")};
  padding: 0 12px;
`;

const FieldInput = styled.TextInput`
  min-height: 44px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  padding: 0 12px;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const TimelineRow = styled(Row)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding: 12px 0;
`;

const RightColumn = styled(Column)`
  align-items: flex-end;
`;

type EventTypeOption = {
  id: string;
  label: string;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatExecutionDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function parsePeriodFilter(startDateInput: string, endDateInput: string) {
  const startDateResult = startDateInput.trim()
    ? validateBrazilianPastOrTodayDateInput(startDateInput)
    : undefined;
  if (startDateResult && !startDateResult.isValid) {
    return { error: startDateResult.message.replace("última execução", "data inicial") };
  }

  const endDateResult = endDateInput.trim()
    ? validateBrazilianPastOrTodayDateInput(endDateInput)
    : undefined;
  if (endDateResult && !endDateResult.isValid) {
    return { error: endDateResult.message.replace("última execução", "data final") };
  }

  const startDate = startDateResult?.date;
  const endDate = endDateResult?.date;
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return { error: "Data inicial não pode ser maior que a data final." };
  }

  return {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  };
}

export default function VehicleMaintenanceTimelineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const maintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const executionHistory = useVehicleStore((state) => state.executionHistory);
  const [selectedTypeId, setSelectedTypeId] = useState("all");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const vehicle = useMemo(
    () => (typeof id === "string" ? vehicles.find((item) => item.id === id) : undefined),
    [id, vehicles],
  );
  const vehicleEvents = useMemo(
    () => (vehicle ? maintenanceEvents.filter((event) => event.vehicleId === vehicle.id) : []),
    [maintenanceEvents, vehicle],
  );
  const eventTypeOptions = useMemo<EventTypeOption[]>(() => {
    const optionsByTypeId = new Map<string, EventTypeOption>();
    for (const event of vehicleEvents) {
      if (!optionsByTypeId.has(event.typeId)) {
        optionsByTypeId.set(event.typeId, { id: event.typeId, label: event.name });
      }
    }
    return [...optionsByTypeId.values()].sort((left, right) =>
      left.label.localeCompare(right.label, "pt-BR"),
    );
  }, [vehicleEvents]);
  const periodFilter = useMemo(
    () => parsePeriodFilter(startDateInput, endDateInput),
    [endDateInput, startDateInput],
  );
  const timeline = useMemo(() => {
    if (!vehicle || "error" in periodFilter) {
      return { totalPaid: 0, groups: [] };
    }

    return buildVehicleMaintenanceTimeline(vehicle.id, maintenanceEvents, executionHistory, {
      eventTypeId: selectedTypeId === "all" ? undefined : selectedTypeId,
      startDate: periodFilter.startDate,
      endDate: periodFilter.endDate,
    });
  }, [executionHistory, maintenanceEvents, periodFilter, selectedTypeId, vehicle]);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  if (!isHydrated) {
    return (
      <Screen>
        <AppText $size={18} $weight={600}>
          Carregando histórico...
        </AppText>
      </Screen>
    );
  }

  if (!vehicle) {
    return (
      <Screen>
        <Title>Histórico do veículo</Title>
        <AppText $color="muted">Veículo não encontrado.</AppText>
        <ActionButton
          $primary
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/vehicles")}
        >
          <Ionicons name="car-sport-outline" size={18} color="white" />
          <AppText $color="white" $weight={700}>
            Ver frota
          </AppText>
        </ActionButton>
      </Screen>
    );
  }

  return (
    <Screen>
      <Column $gap={4}>
        <Title>Histórico do veículo</Title>
        <AppText $color="muted">{vehicle.nickname}</AppText>
      </Column>

      <Card $gap={8}>
        <AppText $color="muted" $size={12} $weight={600}>
          Custo total no período
        </AppText>
        <AppText $size={24} $weight={700}>
          {formatCurrency(timeline.totalPaid)}
        </AppText>
      </Card>

      <Card $gap={12}>
        <AppText $size={18} $weight={600}>
          Filtros
        </AppText>

        <Column $gap={8}>
          <AppText $weight={600}>Tipo de evento</AppText>
          <FilterOptions>
            {[{ id: "all", label: "Todos" }, ...eventTypeOptions].map((option) => {
              const isSelected = selectedTypeId === option.id;
              return (
                <FilterButton
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedTypeId(option.id)}
                  $selected={isSelected}
                >
                  <AppText $color={isSelected ? "white" : "text"} $weight={700}>
                    {option.label}
                  </AppText>
                </FilterButton>
              );
            })}
          </FilterOptions>
        </Column>

        <Row $gap={12} $align="flex-start">
          <Column $gap={8} $flex={1}>
            <AppText $weight={600}>Data inicial</AppText>
            <FieldInput
              accessibilityHint="Use o formato DD/MM/AAAA."
              accessibilityLabel="Data inicial do período"
              maxLength={10}
              onChangeText={(text) => setStartDateInput(maskBrazilianDateInput(text))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#757575"
              value={startDateInput}
            />
          </Column>
          <Column $gap={8} $flex={1}>
            <AppText $weight={600}>Data final</AppText>
            <FieldInput
              accessibilityHint="Use o formato DD/MM/AAAA."
              accessibilityLabel="Data final do período"
              maxLength={10}
              onChangeText={(text) => setEndDateInput(maskBrazilianDateInput(text))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#757575"
              value={endDateInput}
            />
          </Column>
        </Row>

        {"error" in periodFilter ? (
          <AppText $color="primary" $weight={600}>
            {periodFilter.error}
          </AppText>
        ) : null}
      </Card>

      {timeline.groups.length === 0 ? (
        <Card $gap={8}>
          <AppText $color="muted">
            Nenhuma manutenção realizada para os filtros selecionados.
          </AppText>
        </Card>
      ) : (
        timeline.groups.map((group) => (
          <Card key={group.id} $gap={8}>
            <Row $justify="space-between" $align="flex-start">
              <Column $gap={4} $flex={1}>
                <AppText $size={18} $weight={700}>
                  {group.label}
                </AppText>
                <AppText $color="muted">{group.items.length} evento(s) realizado(s)</AppText>
              </Column>
              <AppText $weight={700}>{formatCurrency(group.totalPaid)}</AppText>
            </Row>

            {group.items.map(({ execution, event }) => (
              <TimelineRow key={execution.id} $align="flex-start" $justify="space-between">
                <Column $gap={4} $flex={1}>
                  <AppText $weight={700}>{event.name}</AppText>
                  <AppText $color="muted" $size={12}>
                    {execution.location ?? "Local não informado"}
                  </AppText>
                  <AppText $color="muted" $size={12}>
                    {formatExecutionDate(execution.executionDate)}
                  </AppText>
                </Column>
                <RightColumn $gap={4}>
                  <AppText $weight={600}>
                    {execution.executionKm.toLocaleString("pt-BR")} km
                  </AppText>
                  <AppText $color="muted" $size={12}>
                    {execution.value === undefined
                      ? "Valor não informado"
                      : formatCurrency(execution.value)}
                  </AppText>
                </RightColumn>
              </TimelineRow>
            ))}
          </Card>
        ))
      )}

      <ActionButton
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/vehicle/[id]", params: { id: vehicle.id } })}
      >
        <Ionicons name="arrow-back-outline" size={18} color="#757575" />
        <AppText $weight={700}>Voltar ao veículo</AppText>
      </ActionButton>
    </Screen>
  );
}
