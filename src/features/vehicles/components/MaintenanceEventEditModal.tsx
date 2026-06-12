import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-native";
import { styled } from "styled-components/native";

import { AppText, Column, Row } from "@/components/common/styled";
import {
  formatBrazilianDateInput,
  getMaintenanceEventType,
  MAINTENANCE_EVENT_TYPES,
  maskBrazilianDateInput,
  validateBrazilianPastOrTodayDateInput,
  type MaintenanceEventTypeId,
} from "@/features/vehicles/rules/maintenanceEvents";
import type {
  CustomMaintenanceType,
  MaintenanceEvent,
  UpdateMaintenanceEventInput,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

type MaintenanceEventEditModalProps = {
  visible: boolean;
  event?: MaintenanceEvent;
  vehicle: Vehicle;
  customMaintenanceTypes: CustomMaintenanceType[];
  onDismiss: () => void;
  onSubmit: (input: UpdateMaintenanceEventInput) => Promise<void>;
};

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

const FormScroll = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 12, paddingBottom: 16 },
  keyboardShouldPersistTaps: "handled" as const,
})`
  margin-top: 16px;
`;

const Field = styled(Column)`
  gap: 8px;
`;

const FieldInput = styled.TextInput`
  min-height: 48px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  padding: 0 16px;
  background-color: ${({ theme }) => theme.background};
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

const ActionButton = styled.Pressable<{ $primary?: boolean; disabled?: boolean }>`
  min-height: 48px;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border-width: ${({ $primary }) => ($primary ? 0 : 1)}px;
  border-color: ${({ theme }) => theme.border};
  background-color: ${({ $primary, theme }) => ($primary ? theme.primary : "transparent")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

export function MaintenanceEventEditModal({
  visible,
  event,
  vehicle,
  customMaintenanceTypes,
  onDismiss,
  onSubmit,
}: MaintenanceEventEditModalProps) {
  const [selectedTypeId, setSelectedTypeId] =
    useState<MaintenanceEventTypeId>("alignment-balancing");
  const [customName, setCustomName] = useState("");
  const [intervalKm, setIntervalKm] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("");
  const [lastExecutionKm, setLastExecutionKm] = useState("");
  const [lastExecutionDate, setLastExecutionDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomType = useMemo(
    () => customMaintenanceTypes.find((type) => type.id === selectedTypeId),
    [customMaintenanceTypes, selectedTypeId],
  );

  useEffect(() => {
    if (!visible || !event) {
      return;
    }

    const customType = customMaintenanceTypes.find((type) => type.id === event.typeId);
    const systemType = customType ? undefined : getMaintenanceEventType(event.typeId);
    setSelectedTypeId(event.typeId);
    setCustomName(event.typeId === "custom" ? event.name : "");
    setIntervalKm(
      String(event.intervalKm ?? customType?.intervalKm ?? systemType?.intervalKm ?? ""),
    );
    setIntervalMonths(
      String(
        event.intervalMonths ?? customType?.intervalMonths ?? systemType?.intervalMonths ?? "",
      ),
    );
    setLastExecutionKm(event.lastExecutionKm === undefined ? "" : String(event.lastExecutionKm));
    setLastExecutionDate(formatBrazilianDateInput(event.lastExecutionDate));
    setError(null);
    setIsSaving(false);
  }, [customMaintenanceTypes, event, visible]);

  function applyType(typeId: MaintenanceEventTypeId) {
    const customType = customMaintenanceTypes.find((type) => type.id === typeId);
    const systemType = customType ? undefined : getMaintenanceEventType(typeId);
    setSelectedTypeId(typeId);
    setCustomName(typeId === "custom" ? customName : "");
    setIntervalKm(String(customType?.intervalKm ?? systemType?.intervalKm ?? ""));
    setIntervalMonths(String(customType?.intervalMonths ?? systemType?.intervalMonths ?? ""));
    setError(null);
  }

  async function handleSubmit() {
    const parsedIntervalKm = intervalKm.trim() ? Number.parseInt(intervalKm, 10) : undefined;
    const parsedIntervalMonths = intervalMonths.trim()
      ? Number.parseInt(intervalMonths, 10)
      : undefined;
    const parsedLastExecutionKm = lastExecutionKm.trim()
      ? Number.parseInt(lastExecutionKm, 10)
      : undefined;
    const parsedLastExecutionDateResult = lastExecutionDate.trim()
      ? validateBrazilianPastOrTodayDateInput(lastExecutionDate)
      : undefined;

    if (parsedLastExecutionDateResult && !parsedLastExecutionDateResult.isValid) {
      setError(parsedLastExecutionDateResult.message);
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        typeId: selectedTypeId,
        customName,
        intervalKm: parsedIntervalKm,
        intervalMonths: parsedIntervalMonths,
        lastExecutionKm: parsedLastExecutionKm,
        lastExecutionDate: parsedLastExecutionDateResult?.date.toISOString(),
      });
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado ao editar manutenção.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onDismiss}>
      <ModalOverlay>
        <Backdrop onPress={onDismiss} />
        <Sheet>
          <Column $gap={4}>
            <AppText $size={18} $weight={700}>
              Editar manutenção
            </AppText>
            <AppText $color="muted">
              Alterações nos intervalos recalculam automaticamente os próximos prazos.
            </AppText>
          </Column>

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
                        applyType(type.id);
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
                        applyType(type.id);
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
              <Field>
                <AppText $weight={600}>Nome da manutenção</AppText>
                <FieldInput
                  accessibilityLabel="Nome da manutenção personalizada"
                  maxLength={80}
                  onChangeText={(value) => {
                    setCustomName(value);
                    setError(null);
                  }}
                  value={customName}
                />
              </Field>
            ) : null}

            <Field>
              <AppText $weight={600}>Intervalo em km</AppText>
              <FieldInput
                accessibilityLabel="Intervalo da manutenção em quilômetros"
                keyboardType="number-pad"
                maxLength={9}
                onChangeText={(value) => {
                  setIntervalKm(value.replace(/\D/g, "").slice(0, 9));
                  setError(null);
                }}
                placeholder="Opcional"
                placeholderTextColor="#757575"
                value={intervalKm}
              />
            </Field>

            <Field>
              <AppText $weight={600}>Intervalo em meses</AppText>
              <FieldInput
                accessibilityLabel="Intervalo da manutenção em meses"
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={(value) => {
                  setIntervalMonths(value.replace(/\D/g, "").slice(0, 4));
                  setError(null);
                }}
                placeholder="Opcional"
                placeholderTextColor="#757575"
                value={intervalMonths}
              />
            </Field>

            {intervalKm.trim() ? (
              <Field>
                <AppText $weight={600}>Km da última execução</AppText>
                <FieldInput
                  accessibilityLabel="Quilometragem da última execução"
                  keyboardType="number-pad"
                  maxLength={9}
                  onChangeText={(value) => {
                    setLastExecutionKm(value.replace(/\D/g, "").slice(0, 9));
                    setError(null);
                  }}
                  placeholder={`Até ${vehicle.currentKm.toLocaleString("pt-BR")} km`}
                  placeholderTextColor="#757575"
                  value={lastExecutionKm}
                />
              </Field>
            ) : null}

            {intervalMonths.trim() ? (
              <Field>
                <AppText $weight={600}>Data da última execução</AppText>
                <FieldInput
                  accessibilityHint="Use o formato DD/MM/AAAA."
                  accessibilityLabel="Data da última execução"
                  maxLength={10}
                  onChangeText={(value) => {
                    setLastExecutionDate(maskBrazilianDateInput(value));
                    setError(null);
                  }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#757575"
                  value={lastExecutionDate}
                />
              </Field>
            ) : null}

            {selectedCustomType ? (
              <AppText $color="muted" $size={12}>
                O intervalo editado vale somente para este evento.
              </AppText>
            ) : null}
          </FormScroll>

          {error ? (
            <AppText $color="primary" $weight={600} style={{ marginBottom: 8 }}>
              {error}
            </AppText>
          ) : null}

          <Row $gap={12}>
            <ActionButton accessibilityRole="button" disabled={isSaving} onPress={onDismiss}>
              <AppText $weight={700}>Cancelar</AppText>
            </ActionButton>
            <ActionButton
              $primary
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving }}
              disabled={isSaving}
              onPress={() => {
                void handleSubmit();
              }}
            >
              <AppText $color="white" $weight={700}>
                Salvar alterações
              </AppText>
            </ActionButton>
          </Row>
        </Sheet>
      </ModalOverlay>
    </Modal>
  );
}
