import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal } from "react-native";
import { styled } from "styled-components/native";

import { KmUpdateModal } from "@/features/vehicles/components/KmUpdateModal";
import { Card } from "@/components/common/Card";
import { AppText, Column, Row, Screen, ScreenContent, Title } from "@/components/common/styled";
import { useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import {
  calculateMaintenanceSchedule,
  formatBrazilianDateInput,
  MAINTENANCE_EVENT_TYPES,
  maskBrazilianDateInput,
  type MaintenanceEventTypeId,
  validateBrazilianFutureDateInput,
} from "@/features/vehicles/rules/maintenanceEvents";

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

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const recordKm = useVehicleStore((state) => state.recordKm);
  const addMaintenanceEvent = useVehicleStore((state) => state.addMaintenanceEvent);
  const vehicle = useVehicleStore((state) =>
    typeof id === "string" ? state.vehicles.find((item) => item.id === id) : undefined,
  );
  const allKmRecords = useVehicleStore((state) => state.kmRecords);
  const allMaintenanceEvents = useVehicleStore((state) => state.maintenanceEvents);
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] =
    useState<MaintenanceEventTypeId>("alignment-balancing");
  const [customName, setCustomName] = useState("");
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
  const maintenanceEvents = useMemo(
    () =>
      typeof id === "string"
        ? allMaintenanceEvents
            .filter((event) => event.vehicleId === id)
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        : [],
    [allMaintenanceEvents, id],
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

  function applyMaintenanceType(typeId: MaintenanceEventTypeId) {
    setSelectedTypeId(typeId);
    setMaintenanceError(null);

    if (!vehicle) {
      return;
    }

    const schedule = calculateMaintenanceSchedule(typeId, vehicle.currentKm);
    setNextKm(schedule.nextKm === undefined ? "" : String(schedule.nextKm));
    setNextDate(formatBrazilianDateInput(schedule.nextDate));

    if (typeId !== "custom") {
      setCustomName("");
    }
  }

  function openMaintenanceModal() {
    setCustomName("");
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

          {maintenanceEvents.length === 0 ? (
            <AppText $color="muted">Nenhuma manutenção cadastrada.</AppText>
          ) : (
            maintenanceEvents.map((event) => (
              <HistoryRow key={event.id} $align="flex-start" $justify="space-between">
                <Column $gap={4} $flex={1}>
                  <AppText $weight={700}>{event.name}</AppText>
                  <AppText $color="muted" $size={12}>
                    Criada em {new Date(event.createdAt).toLocaleDateString("pt-BR")}
                  </AppText>
                </Column>
                <Column $gap={4}>
                  <AppText $weight={600}>
                    {event.nextKm === undefined
                      ? "Sem km"
                      : `${event.nextKm.toLocaleString("pt-BR")} km`}
                  </AppText>
                  <AppText $color="muted" $size={12}>
                    {formatMaintenanceDate(event.nextDate)}
                  </AppText>
                </Column>
              </HistoryRow>
            ))
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
                </Column>
              </Field>

              {selectedTypeId === "custom" ? (
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
              ) : null}

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
