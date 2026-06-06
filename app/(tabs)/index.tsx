import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { KmUpdateModal } from "@/components/features/KmUpdateModal";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useVehicleStore } from "@/store/vehicleStore";
import { useAppTheme } from "@/components/ThemeProvider";
import type { KmPromptFrequency } from "@/lib/kmReminder";

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);
  const kmPromptFrequency = useVehicleStore((state) => state.kmPromptFrequency);
  const recordKm = useVehicleStore((state) => state.recordKm);
  const setKmPromptFrequency = useVehicleStore((state) => state.setKmPromptFrequency);
  const markKmPromptShown = useVehicleStore((state) => state.markKmPromptShown);
  const getVehiclesPendingKmPrompt = useVehicleStore((state) => state.getVehiclesPendingKmPrompt);
  const [promptVehicleId, setPromptVehicleId] = useState<string | null>(null);
  const totalKm = vehicles.reduce((sum, vehicle) => sum + vehicle.currentKm, 0);
  const hasVehicles = vehicles.length > 0;
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

  async function handleFrequencyChange(frequency: KmPromptFrequency) {
    try {
      await setKmPromptFrequency(frequency);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar frequência.";
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
      await markKmPromptShown(promptVehicle.id);
      setPromptVehicleId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar lembrete.";
      Alert.alert("Não foi possível salvar", message);
    }
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-5 pb-32">
        {/* Header com Toggle */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-jakarta text-3xl font-bold text-text">Dashboard</Text>
            <Text className="font-jakarta mt-1 text-base text-muted">
              Resumo local dos seus veículos.
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <View className="gap-4">
          <Text className="font-jakarta text-xl font-bold text-text">Resumo rápido</Text>
          <View className="flex-row gap-4">
            <Card className="flex-1 p-4" style={{ minHeight: 120 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="car-outline" size={18} color={isDark ? "#B0BEC5" : "#757575"} />
                  <Text className="font-jakarta text-xs font-medium text-muted">
                    Veículos cadastrados
                  </Text>
                </View>
              </View>
              <Text className="font-jakarta mt-2 text-4xl font-bold text-text">
                {isHydrated ? vehicles.length : "-"}
              </Text>
              <Text className="font-jakarta mt-auto text-[11px] text-muted">
                Frota registrada localmente
              </Text>
            </Card>

            <Card className="flex-1 p-4" style={{ minHeight: 120 }}>
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={isDark ? "#B0BEC5" : "#757575"}
                />
                <Text className="font-jakarta text-xs font-medium text-muted">Km total:</Text>
              </View>
              <Text className="font-jakarta mt-2 text-3xl font-bold text-text">
                {isHydrated ? totalKm.toLocaleString("pt-BR") : "-"}
              </Text>
              <View className="mt-auto flex-row items-center gap-1">
                <Text className="font-jakarta text-[11px] text-muted">Soma da frota local</Text>
              </View>
            </Card>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-jakarta text-xl font-bold text-text">Atualização de km</Text>
          <Card className="gap-3 p-4">
            <View className="gap-1">
              <Text className="font-jakarta text-sm font-bold text-text">Solicitar ao abrir</Text>
              <Text className="font-jakarta text-sm text-muted">
                Frequência usada para lembrar a atualização da km atual dos veículos.
              </Text>
            </View>
            <View className="flex-row gap-2">
              {(["daily", "weekly"] as const).map((frequency) => {
                const isSelected = kmPromptFrequency === frequency;
                return (
                  <Pressable
                    key={frequency}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className="min-h-10 flex-1 items-center justify-center rounded-lg border px-3"
                    onPress={() => {
                      void handleFrequencyChange(frequency);
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "#2196F3"
                          : "#E53935"
                        : "transparent",
                      borderColor: isSelected ? (isDark ? "#2196F3" : "#E53935") : "#DADDE1",
                    }}
                  >
                    <Text
                      className="font-jakarta text-sm font-bold"
                      style={{ color: isSelected ? "#FFFFFF" : isDark ? "#FFFFFF" : "#1F2933" }}
                    >
                      {frequency === "daily" ? "Diário" : "Semanal"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-jakarta text-xl font-bold text-text">Próxima revisão</Text>
            <Pressable onPress={() => router.push("/(tabs)/vehicles")}>
              <Text className="text-sm font-bold text-accent font-jakarta">Ver veículos</Text>
            </Pressable>
          </View>
          <Card className="p-0 overflow-hidden">
            <View
              className="flex-row items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: hasVehicles ? (isDark ? "#2196F3" : "#E53935") : "#757575",
              }}
            >
              <Ionicons
                name={hasVehicles ? (isDark ? "construct" : "alert-circle") : "information-circle"}
                size={20}
                color="white"
              />
              <Text className="font-jakarta text-sm font-bold text-white uppercase tracking-wider">
                {hasVehicles ? "Acompanhamento local" : "Nenhum veículo cadastrado"}
              </Text>
            </View>

            <View className="p-3 gap-2">
              <Text className="font-jakarta text-sm font-bold text-text leading-relaxed">
                {hasVehicles
                  ? "Nenhuma revisão pendente foi registrada para a frota atual."
                  : "Cadastre um veículo para acompanhar quilometragem e revisões."}
              </Text>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                  <Text className="font-jakarta text-sm text-text">
                    <Text className="font-bold">Frota:</Text>{" "}
                    {isHydrated ? `${vehicles.length} veículo(s)` : "Carregando..."}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                  <Text className="font-jakarta text-sm text-text">
                    <Text className="font-bold">Km total:</Text>{" "}
                    {isHydrated ? `${totalKm.toLocaleString("pt-BR")} km` : "Carregando..."}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                  <Text className="font-jakarta text-sm text-text">
                    <Text className="font-bold">Ação recomendada:</Text>{" "}
                    {hasVehicles
                      ? "Revise os veículos cadastrados."
                      : "Adicione o primeiro veículo."}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
      <KmUpdateModal
        visible={Boolean(promptVehicle)}
        vehicle={promptVehicle}
        onSubmit={handlePromptSubmit}
        onDismiss={handlePromptDismiss}
      />
    </>
  );
}
