import { useEffect, useMemo } from "react";
import { styled } from "styled-components/native";

import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, Title } from "@/components/common/styled";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import { useAppTheme } from "@/theme/ThemeProvider";

const HistoryRow = styled(Row)`
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.border};
  padding: 12px 0;
`;

const RightColumn = styled(Column)`
  align-items: flex-end;
`;

export default function HistoryScreen() {
  const { isDark } = useAppTheme();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const maintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const executionHistory = useVehicleStore((state) => state.executionHistory);
  const items = useMemo(
    () =>
      executionHistory
        .map((execution) => {
          const event = maintenanceEvents.find((item) => item.id === execution.vehicleEventId);
          const vehicle = event ? vehicles.find((item) => item.id === event.vehicleId) : undefined;
          return { execution, event, vehicle };
        })
        .filter((item) => item.event && item.vehicle)
        .sort(
          (a, b) => Date.parse(b.execution.executionDate) - Date.parse(a.execution.executionDate),
        ),
    [executionHistory, maintenanceEvents, vehicles],
  );

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  return (
    <Screen style={{ backgroundColor: isDark ? "#353935" : "#ECEFF1" }}>
      <Title>Histórico</Title>
      <Card $gap={8}>
        <AppText $size={18} $weight={600}>
          Linha do tempo
        </AppText>
        {!isHydrated ? (
          <AppText $color="muted">Carregando histórico...</AppText>
        ) : items.length === 0 ? (
          <AppText $color="muted">Nenhuma manutenção efetuada.</AppText>
        ) : (
          items.map(({ execution, event, vehicle }) => (
            <HistoryRow key={execution.id} $align="flex-start" $justify="space-between">
              <Column $gap={4} $flex={1}>
                <AppText $weight={700}>{event?.name}</AppText>
                <AppText $color="muted">{vehicle?.nickname}</AppText>
                {execution.location ? (
                  <AppText $color="muted" $size={12}>
                    {execution.location}
                  </AppText>
                ) : null}
              </Column>
              <RightColumn $gap={4}>
                <AppText $weight={600}>{execution.executionKm.toLocaleString("pt-BR")} km</AppText>
                <AppText $color="muted" $size={12}>
                  {new Date(execution.executionDate).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </AppText>
                {execution.value !== undefined ? (
                  <AppText $color="muted" $size={12}>
                    {execution.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </AppText>
                ) : null}
              </RightColumn>
            </HistoryRow>
          ))
        )}
      </Card>
    </Screen>
  );
}
