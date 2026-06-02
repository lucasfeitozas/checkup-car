import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { VehicleCard } from "@/components/features/VehicleCard";
import { Button } from "@/components/ui/Button";
import { useVehicleStore } from "@/store/vehicleStore";

const MAX_VEHICLES_PER_USER = 5;

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatPlate(value: string) {
  const v = normalizePlate(value);
  if (/^[A-Z]{3}\d{4}$/.test(v)) {
    return `${v.slice(0, 3)}-${v.slice(3)}`;
  }
  return v;
}

function isValidPlate(value: string) {
  const v = normalizePlate(value);
  return /^[A-Z]{3}\d{4}$/.test(v) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(v);
}

export default function VehiclesScreen() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const addVehicle = useVehicleStore((state) => state.addVehicle);
  const hydrate = useVehicleStore((state) => state.hydrate);
  const isHydrated = useVehicleStore((state) => state.isHydrated);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [nickname, setNickname] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  const isLimitReached = vehicles.length >= MAX_VEHICLES_PER_USER;

  const errors = useMemo(() => {
    const next: string[] = [];

    if (isLimitReached) next.push(`Limite de ${MAX_VEHICLES_PER_USER} veículos atingido.`);

    if (!plate.trim()) next.push("Placa é obrigatória.");
    if (plate.trim() && !isValidPlate(plate)) next.push("Placa inválida. Use AAA-0000 ou AAA0A00.");
    if (!nickname.trim()) next.push("Nome/apelido é obrigatório.");
    if (!model.trim()) next.push("Modelo é obrigatório.");

    const parsedYear = Number.parseInt(year, 10);
    if (!year.trim() || Number.isNaN(parsedYear)) next.push("Ano é obrigatório.");

    const parsedKm = Number.parseInt(currentKm, 10);
    if (!currentKm.trim() || Number.isNaN(parsedKm) || parsedKm < 0) {
      next.push("Km atual deve ser um número maior ou igual a zero.");
    }

    return next;
  }, [currentKm, isLimitReached, model, nickname, plate, year]);

  const isSubmitDisabled = errors.length > 0;

  function resetForm() {
    setPlate("");
    setNickname("");
    setBrand("");
    setModel("");
    setYear("");
    setCurrentKm("");
  }

  async function handleCreateVehicle() {
    if (errors.length > 0) {
      Alert.alert("Não foi possível cadastrar", errors[0]);
      return;
    }

    try {
      const parsedYear = Number.parseInt(year, 10);
      const parsedKm = Number.parseInt(currentKm, 10);

      await addVehicle({
        nickname: nickname.trim(),
        brand: brand.trim() ? brand.trim() : undefined,
        model: model.trim(),
        year: parsedYear,
        plate: formatPlate(plate),
        currentKm: parsedKm,
      });

      resetForm();
      setIsCreateOpen(false);
      setSuccessMessage("Veículo cadastrado com sucesso!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro inesperado ao cadastrar veículo.";
      Alert.alert("Não foi possível cadastrar", message);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <View>
        <Text className="font-jakarta text-2xl font-bold text-text">Veículos</Text>
        <Text className="font-jakarta mt-1 text-base text-muted">Gerencie sua frota.</Text>
      </View>

      <View className="gap-2">
        <Button
          title={isLimitReached ? "Limite atingido" : "Adicionar veículo"}
          onPress={() => {
            setSuccessMessage(null);
            setIsCreateOpen(true);
          }}
          disabled={isLimitReached}
        />
        {isLimitReached ? (
          <Text className="font-jakarta text-sm font-semibold text-muted">
            Você já cadastrou {MAX_VEHICLES_PER_USER} veículos nesta conta.
          </Text>
        ) : null}
        {successMessage ? (
          <Text className="font-jakarta text-sm font-semibold text-green-600">
            {successMessage}
          </Text>
        ) : null}
      </View>

      {!isHydrated ? (
        <Text className="font-jakarta text-sm text-muted">Carregando veículos...</Text>
      ) : vehicles.length === 0 ? (
        <View className="rounded-xl border border-border bg-surface p-4">
          <Text className="font-jakarta text-base font-bold text-text">
            Nenhum veículo cadastrado
          </Text>
          <Text className="font-jakarta mt-1 text-sm text-muted">
            Adicione seu primeiro veículo para começar.
          </Text>
        </View>
      ) : (
        vehicles.map((vehicle) => (
          <Link href={{ pathname: "/vehicle/[id]", params: { id: vehicle.id } }} key={vehicle.id}>
            <VehicleCard vehicle={vehicle} />
          </Link>
        ))
      )}

      <Modal
        transparent
        animationType="slide"
        visible={isCreateOpen}
        onRequestClose={() => {
          setIsCreateOpen(false);
        }}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => {
            setIsCreateOpen(false);
          }}
        />
        <View className="rounded-t-3xl bg-background p-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-jakarta text-lg font-bold text-text">Cadastrar veículo</Text>
            <Pressable
              onPress={() => {
                setIsCreateOpen(false);
              }}
              className="rounded-lg border border-border px-3 py-2"
              accessibilityRole="button"
            >
              <Text className="font-jakarta text-sm font-bold text-text">Fechar</Text>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Placa</Text>
              <TextInput
                value={plate}
                onChangeText={(v) => {
                  setPlate(formatPlate(v));
                  if (successMessage) setSuccessMessage(null);
                }}
                autoCapitalize="characters"
                placeholder="AAA-0000 ou AAA0A00"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Nome/apelido</Text>
              <TextInput
                value={nickname}
                onChangeText={(v) => {
                  setNickname(v);
                  if (successMessage) setSuccessMessage(null);
                }}
                placeholder="Ex: Meu carro"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Marca (opcional)</Text>
              <TextInput
                value={brand}
                onChangeText={(v) => {
                  setBrand(v);
                  if (successMessage) setSuccessMessage(null);
                }}
                placeholder="Ex: Toyota"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Modelo</Text>
              <TextInput
                value={model}
                onChangeText={(v) => {
                  setModel(v);
                  if (successMessage) setSuccessMessage(null);
                }}
                placeholder="Ex: Corolla"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Ano</Text>
              <TextInput
                value={year}
                onChangeText={(v) => {
                  setYear(v.replace(/\D/g, "").slice(0, 4));
                  if (successMessage) setSuccessMessage(null);
                }}
                keyboardType="number-pad"
                placeholder="Ex: 2022"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <View className="gap-2">
              <Text className="font-jakarta text-sm font-semibold text-text">Km atual</Text>
              <TextInput
                value={currentKm}
                onChangeText={(v) => {
                  setCurrentKm(v.replace(/\D/g, "").slice(0, 9));
                  if (successMessage) setSuccessMessage(null);
                }}
                keyboardType="number-pad"
                placeholder="Ex: 42000"
                className="min-h-12 rounded-lg border border-border bg-background px-4 text-text"
              />
            </View>

            <Button title="Cadastrar" onPress={handleCreateVehicle} disabled={isSubmitDisabled} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
