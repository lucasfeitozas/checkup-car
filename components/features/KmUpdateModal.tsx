import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { useAppTheme } from "@/components/ThemeProvider";
import type { Vehicle } from "@/store/vehicleStore";

type KmUpdateModalProps = {
  visible: boolean;
  vehicle: Vehicle | null;
  onSubmit: (km: number) => Promise<void>;
  onDismiss: () => Promise<void> | void;
};

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
      <View
        className="flex-1 justify-center px-5"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
      >
        <View
          className="gap-4 rounded-xl border p-5"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="gap-1">
            <Text className="font-jakarta text-lg font-bold text-text">Atualizar km atual</Text>
            <Text className="font-jakarta text-sm text-muted">
              {vehicle
                ? `${vehicle.nickname}: último registro ${vehicle.currentKm.toLocaleString(
                    "pt-BR",
                  )} km`
                : "Selecione um veículo para atualizar."}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-jakarta text-sm font-semibold text-text">Km atual</Text>
            <TextInput
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
              className="min-h-12 rounded-lg border px-4 text-text"
              style={{
                backgroundColor: theme.background,
                borderColor: error ? theme.primary : theme.border,
                color: theme.text,
              }}
            />
            {error ? (
              <Text className="font-jakarta text-sm font-semibold" style={{ color: theme.primary }}>
                {error}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-lg border border-border px-4 active:opacity-80"
              onPress={onDismiss}
              disabled={isSaving}
            >
              <Text className="font-jakarta text-sm font-bold text-text">Agora não</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isInvalid }}
              className="min-h-12 flex-1 items-center justify-center rounded-lg px-4"
              disabled={isInvalid}
              onPress={handleSubmit}
              style={{ opacity: isInvalid ? 0.5 : 1, backgroundColor: theme.primary }}
            >
              <Text className="font-jakarta text-sm font-bold text-white">
                {isSaving ? "Salvando..." : "Salvar km"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
