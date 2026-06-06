import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-native";
import { styled } from "styled-components/native";

import { useAppTheme } from "@/components/ThemeProvider";
import { AppText, Column, Row } from "@/components/ui/styled";
import type { Vehicle } from "@/store/vehicleStore";

type KmUpdateModalProps = {
  visible: boolean;
  vehicle: Vehicle | null;
  onSubmit: (km: number) => Promise<void>;
  onDismiss: () => Promise<void> | void;
};

const Overlay = styled.View`
  flex: 1;
  justify-content: center;
  padding: 0 20px;
  background-color: rgba(0, 0, 0, 0.55);
`;

const Panel = styled.View`
  gap: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.surface};
  padding: 20px;
`;

const KmInput = styled.TextInput<{ $hasError: boolean }>`
  min-height: 48px;
  border-radius: 8px;
  border-width: 1px;
  padding: 0 16px;
  background-color: ${({ theme }) => theme.background};
  border-color: ${({ $hasError, theme }) => ($hasError ? theme.primary : theme.border)};
  color: ${({ theme }) => theme.text};
`;

const ModalButton = styled.Pressable<{ $primary?: boolean; disabled?: boolean }>`
  min-height: 48px;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border-width: ${({ $primary }) => ($primary ? 0 : 1)}px;
  border-color: ${({ theme }) => theme.border};
  background-color: ${({ $primary, theme }) => ($primary ? theme.primary : "transparent")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  padding: 0 16px;
`;

export function KmUpdateModal({ visible, vehicle, onSubmit, onDismiss }: KmUpdateModalProps) {
  const { theme } = useAppTheme();
  const [km, setKm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && vehicle) {
      setKm(String(vehicle.currentKm));
      setError(null);
    }
  }, [vehicle, visible]);

  const parsedKm = useMemo(() => Number.parseInt(km, 10), [km]);
  const isInvalid = !vehicle || Number.isNaN(parsedKm) || parsedKm < vehicle.currentKm || isSaving;

  async function handleSubmit() {
    if (!vehicle) {
      return;
    }

    if (Number.isNaN(parsedKm) || parsedKm < vehicle.currentKm) {
      setError(`Informe uma km maior ou igual a ${vehicle.currentKm.toLocaleString("pt-BR")} km.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(parsedKm);
      setKm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar a km.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <Overlay>
        <Panel>
          <Column $gap={4}>
            <AppText $size={18} $weight={700}>
              Atualizar km atual
            </AppText>
            <AppText $color="muted">
              {vehicle
                ? `${vehicle.nickname}: último registro ${vehicle.currentKm.toLocaleString(
                    "pt-BR",
                  )} km`
                : "Selecione um veículo para atualizar."}
            </AppText>
          </Column>

          <Column $gap={8}>
            <AppText $weight={600}>Km atual</AppText>
            <KmInput
              value={km}
              onChangeText={(value) => {
                setKm(value.replace(/\D/g, "").slice(0, 9));
                setError(null);
              }}
              accessibilityLabel="Nova quilometragem atual"
              keyboardType="number-pad"
              maxLength={9}
              placeholder="Ex: 43000"
              placeholderTextColor={theme.muted}
              $hasError={Boolean(error)}
            />
            {error ? (
              <AppText $color="primary" $weight={600}>
                {error}
              </AppText>
            ) : null}
          </Column>

          <Row $gap={12}>
            <ModalButton accessibilityRole="button" onPress={onDismiss} disabled={isSaving}>
              <AppText $weight={700}>Agora não</AppText>
            </ModalButton>
            <ModalButton
              accessibilityRole="button"
              accessibilityState={{ disabled: isInvalid }}
              disabled={isInvalid}
              onPress={handleSubmit}
              $primary
            >
              <AppText $color="white" $weight={700}>
                {isSaving ? "Salvando..." : "Salvar km"}
              </AppText>
            </ModalButton>
          </Row>
        </Panel>
      </Overlay>
    </Modal>
  );
}
