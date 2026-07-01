import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { styled } from "styled-components/native";

import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, Title } from "@/components/common/styled";
import { MaintenanceExecutionModal } from "@/features/vehicles/components/MaintenanceExecutionModal";
import {
  calculateMaintenanceExecutionHistorySummary,
  sortMaintenanceExecutionsChronologically,
} from "@/features/vehicles/rules/maintenanceExecution";
import {
  type MaintenanceExecution,
  useVehicleStore,
} from "@/features/vehicles/stores/vehicleStore";

const ActionButton = styled.Pressable<{ $primary?: boolean; $danger?: boolean; $flex?: number }>`
  min-height: 44px;
  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : "")}
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border-width: ${({ $primary }) => ($primary ? 0 : 1)}px;
  border-color: ${({ $danger, theme }) => ($danger ? theme.primary : theme.border)};
  background-color: ${({ $primary, theme }) => ($primary ? theme.primary : "transparent")};
  padding: 0 12px;
`;

const HistoryRow = styled(Row)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding: 12px 0;
`;

const SummaryGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
`;

const SummaryItem = styled.View`
  min-width: 132px;
  flex: 1;
  gap: 4px;
`;

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatAverageInterval(days?: number, km?: number): string {
  if (days === undefined && km === undefined) {
    return "Sem dados suficientes";
  }

  const parts: string[] = [];
  if (km !== undefined) {
    parts.push(`${km.toLocaleString("pt-BR")} km`);
  }
  if (days !== undefined) {
    parts.push(`${days.toLocaleString("pt-BR")} dia(s)`);
  }

  return parts.join(" / ");
}

export default function MaintenanceExecutionHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const maintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const executionHistory = useVehicleStore((state) => state.executionHistory);
  const updateMaintenanceExecution = useVehicleStore((state) => state.updateMaintenanceExecution);
  const deleteMaintenanceExecution = useVehicleStore((state) => state.deleteMaintenanceExecution);
  const [editingExecution, setEditingExecution] = useState<MaintenanceExecution | undefined>();

  const event = useMemo(
    () => (typeof id === "string" ? maintenanceEvents.find((item) => item.id === id) : undefined),
    [id, maintenanceEvents],
  );
  const vehicle = useMemo(
    () => (event ? vehicles.find((item) => item.id === event.vehicleId) : undefined),
    [event, vehicles],
  );
  const eventExecutions = useMemo(
    () =>
      event
        ? sortMaintenanceExecutionsChronologically(
            executionHistory.filter((execution) => execution.vehicleEventId === event.id),
          )
        : [],
    [event, executionHistory],
  );
  const summary = useMemo(
    () => calculateMaintenanceExecutionHistorySummary(eventExecutions),
    [eventExecutions],
  );

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  function confirmDeleteExecution(execution: MaintenanceExecution) {
    Alert.alert(
      "Excluir registro",
      "Deseja excluir este registro histórico? Os próximos prazos da manutenção serão recalculados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteMaintenanceExecution(execution.id).catch((e: unknown) => {
              const message =
                e instanceof Error ? e.message : "Erro inesperado ao excluir execução.";
              Alert.alert("Não foi possível excluir", message);
            });
          },
        },
      ],
    );
  }

  if (!isHydrated) {
    return (
      <Screen>
        <AppText $size={18} $weight={600}>
          Carregando histórico...
        </AppText>
      </Screen>
    );
  }

  if (!event || !vehicle) {
    return (
      <Screen>
        <Title>Histórico</Title>
        <AppText $color="muted">Manutenção não encontrada.</AppText>
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
    <>
      <Screen>
        <Column $gap={4}>
          <Title>{event.name}</Title>
          <AppText $color="muted">{vehicle.nickname}</AppText>
        </Column>

        <Card $gap={12}>
          <AppText $size={18} $weight={600}>
            Resumo
          </AppText>
          <SummaryGrid>
            <SummaryItem>
              <AppText $color="muted" $size={12} $weight={600}>
                Total gasto
              </AppText>
              <AppText $size={18} $weight={700}>
                {formatCurrency(summary.totalPaid)}
              </AppText>
            </SummaryItem>
            <SummaryItem>
              <AppText $color="muted" $size={12} $weight={600}>
                Intervalo médio
              </AppText>
              <AppText $size={16} $weight={700}>
                {formatAverageInterval(summary.averageDaysInterval, summary.averageKmInterval)}
              </AppText>
            </SummaryItem>
          </SummaryGrid>
        </Card>

        <Card $gap={8}>
          <AppText $size={18} $weight={600}>
            Execuções
          </AppText>
          {eventExecutions.length === 0 ? (
            <AppText $color="muted">Nenhuma execução registrada para esta manutenção.</AppText>
          ) : (
            eventExecutions.map((execution) => (
              <HistoryRow key={execution.id} $align="flex-start" $justify="space-between">
                <Column $gap={4} $flex={1}>
                  <AppText $weight={700}>
                    {new Date(execution.executionDate).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </AppText>
                  <AppText>{execution.executionKm.toLocaleString("pt-BR")} km</AppText>
                  <AppText $color="muted">
                    {execution.value === undefined
                      ? "Valor não informado"
                      : formatCurrency(execution.value)}
                  </AppText>
                  <AppText $color="muted" $size={12}>
                    {execution.location ?? "Local não informado"}
                  </AppText>
                </Column>
                <Column $gap={8}>
                  <ActionButton
                    accessibilityLabel="Editar registro histórico"
                    accessibilityRole="button"
                    onPress={() => setEditingExecution(execution)}
                  >
                    <AppText $weight={700}>Editar</AppText>
                  </ActionButton>
                  <ActionButton
                    $danger
                    accessibilityLabel="Excluir registro histórico"
                    accessibilityRole="button"
                    onPress={() => confirmDeleteExecution(execution)}
                  >
                    <AppText $color="primary" $weight={700}>
                      Excluir
                    </AppText>
                  </ActionButton>
                </Column>
              </HistoryRow>
            ))
          )}
        </Card>

        <ActionButton
          accessibilityRole="button"
          onPress={() => router.push(`/vehicle/${vehicle.id}`)}
        >
          <Ionicons name="arrow-back-outline" size={18} color="#757575" />
          <AppText $weight={700}>Voltar ao veículo</AppText>
        </ActionButton>
      </Screen>

      <MaintenanceExecutionModal
        event={event}
        execution={editingExecution}
        mode="edit"
        onDismiss={() => setEditingExecution(undefined)}
        onSubmit={async (input) => {
          if (!editingExecution) {
            return;
          }
          await updateMaintenanceExecution(editingExecution.id, input);
        }}
        vehicle={vehicle}
        visible={Boolean(editingExecution)}
      />
    </>
  );
}
