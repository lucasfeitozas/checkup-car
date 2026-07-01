import { useEffect, useState } from "react";
import { Modal } from "react-native";
import { styled } from "styled-components/native";

import { AppText, Column, Row } from "@/components/common/styled";
import {
  formatBrazilianDateInput,
  maskBrazilianDateInput,
  validateBrazilianPastOrTodayDateInput,
} from "@/features/vehicles/rules/maintenanceEvents";
import type {
  MaintenanceEvent,
  MaintenanceExecution,
  MaintenanceExecutionInput,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

type MaintenanceExecutionModalProps = {
  visible: boolean;
  event?: MaintenanceEvent;
  execution?: MaintenanceExecution;
  mode?: "create" | "edit";
  vehicle: Vehicle;
  onDismiss: () => void;
  onSubmit: (input: MaintenanceExecutionInput) => Promise<void>;
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
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  background-color: ${({ theme }) => theme.background};
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

const Warning = styled.View`
  gap: 8px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.primary};
  padding: 12px;
`;

function parseOptionalValue(value: string): number | undefined {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return normalized ? Number(normalized) : undefined;
}

export function MaintenanceExecutionModal({
  visible,
  event,
  execution,
  mode = "create",
  vehicle,
  onDismiss,
  onSubmit,
}: MaintenanceExecutionModalProps) {
  const [executionKm, setExecutionKm] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [value, setValue] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<MaintenanceExecutionInput | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setExecutionKm(String(execution?.executionKm ?? vehicle.currentKm));
    setExecutionDate(
      execution
        ? formatBrazilianDateInput(execution.executionDate)
        : new Date().toLocaleDateString("pt-BR"),
    );
    setValue(execution?.value === undefined ? "" : String(execution.value).replace(".", ","));
    setLocation(execution?.location ?? "");
    setError(null);
    setPendingInput(null);
    setIsSaving(false);
  }, [execution, vehicle.currentKm, visible]);

  function prepareConfirmation() {
    const parsedKm = Number.parseInt(executionKm, 10);
    if (!executionKm.trim() || Number.isNaN(parsedKm)) {
      setError("Informe a km de execução.");
      return;
    }

    if (!executionDate.trim()) {
      setError("Informe a data de execução.");
      return;
    }

    const parsedDate = validateBrazilianPastOrTodayDateInput(executionDate);
    if (!parsedDate.isValid) {
      setError(parsedDate.message.replace("última execução", "execução"));
      return;
    }

    const parsedValue = parseOptionalValue(value);
    if (value.trim() && (parsedValue === undefined || Number.isNaN(parsedValue))) {
      setError("Informe um valor pago válido.");
      return;
    }

    setError(null);
    setPendingInput({
      executionKm: parsedKm,
      executionDate: parsedDate.date.toISOString(),
      value: parsedValue,
      location: location.trim() || undefined,
    });
  }

  async function confirmExecution() {
    if (!pendingInput) {
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(pendingInput);
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado ao registrar execução.");
      setPendingInput(null);
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = mode === "edit";

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onDismiss}>
      <ModalOverlay>
        <Backdrop onPress={onDismiss} />
        <Sheet>
          <Column $gap={16}>
            <Column $gap={4}>
              <AppText $size={18} $weight={700}>
                {isEditing ? "Editar execução" : "Efetuar manutenção"}
              </AppText>
              <AppText $color="muted">{event?.name}</AppText>
            </Column>

            {pendingInput ? (
              <Warning>
                <AppText $color="primary" $weight={700}>
                  Atenção
                </AppText>
                <AppText>
                  Confirme a execução em {pendingInput.executionKm.toLocaleString("pt-BR")} km. Os
                  próximos prazos serão recalculados e o registro será{" "}
                  {isEditing ? "atualizado" : "salvo"} no histórico.
                </AppText>
              </Warning>
            ) : (
              <>
                <Field>
                  <AppText $weight={600}>Km de execução *</AppText>
                  <FieldInput
                    accessibilityLabel="Quilometragem de execução"
                    keyboardType="number-pad"
                    maxLength={9}
                    onChangeText={(text) => {
                      setExecutionKm(text.replace(/\D/g, ""));
                      setError(null);
                    }}
                    value={executionKm}
                  />
                </Field>
                <Field>
                  <AppText $weight={600}>Data de execução *</AppText>
                  <FieldInput
                    accessibilityHint="Use o formato DD/MM/AAAA."
                    accessibilityLabel="Data de execução"
                    maxLength={10}
                    onChangeText={(text) => {
                      setExecutionDate(maskBrazilianDateInput(text));
                      setError(null);
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#757575"
                    value={executionDate}
                  />
                </Field>
                <Field>
                  <AppText $weight={600}>Valor pago (R$)</AppText>
                  <FieldInput
                    accessibilityLabel="Valor pago"
                    keyboardType="decimal-pad"
                    maxLength={12}
                    onChangeText={(text) => {
                      setValue(text.replace(/[^\d,.]/g, ""));
                      setError(null);
                    }}
                    placeholder="Opcional"
                    placeholderTextColor="#757575"
                    value={value}
                  />
                </Field>
                <Field>
                  <AppText $weight={600}>Local / oficina</AppText>
                  <FieldInput
                    accessibilityLabel="Local ou oficina"
                    maxLength={100}
                    onChangeText={(text) => {
                      setLocation(text);
                      setError(null);
                    }}
                    placeholder="Opcional"
                    placeholderTextColor="#757575"
                    value={location}
                  />
                </Field>
              </>
            )}

            {error ? (
              <AppText $color="primary" $weight={600}>
                {error}
              </AppText>
            ) : null}

            <Row $gap={12}>
              <ActionButton
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => {
                  if (pendingInput) {
                    setPendingInput(null);
                  } else {
                    onDismiss();
                  }
                }}
              >
                <AppText $weight={700}>{pendingInput ? "Voltar" : "Cancelar"}</AppText>
              </ActionButton>
              <ActionButton
                $primary
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                disabled={isSaving}
                onPress={() => {
                  if (pendingInput) {
                    void confirmExecution();
                  } else {
                    prepareConfirmation();
                  }
                }}
              >
                <AppText $color="white" $weight={700}>
                  {pendingInput
                    ? isEditing
                      ? "Salvar edição"
                      : "Confirmar execução"
                    : "Continuar"}
                </AppText>
              </ActionButton>
            </Row>
          </Column>
        </Sheet>
      </ModalOverlay>
    </Modal>
  );
}
