import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";

import { VehicleCard } from "@/components/features/VehicleCard";
import { Button } from "@/components/ui/Button";
import { useVehicleStore } from "@/store/vehicleStore";

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatPlateInput(value: string) {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  let i = 0;
  let letters = "";
  while (i < raw.length && letters.length < 3) {
    const c = raw[i];
    i += 1;
    if (c && /[A-Z]/.test(c)) {
      letters += c;
    }
  }

  if (letters.length < 3) return letters;

  let digit4 = "";
  while (i < raw.length && digit4.length < 1) {
    const c = raw[i];
    i += 1;
    if (c && /\d/.test(c)) {
      digit4 = c;
    }
  }

  if (!digit4) return letters;

  let fifth = "";
  while (i < raw.length && !fifth) {
    const c = raw[i];
    i += 1;
    if (c && /[A-Z0-9]/.test(c)) {
      fifth = c;
    }
  }

  const isMercosul = fifth ? /[A-Z]/.test(fifth) : false;

  let lastTwo = "";
  while (i < raw.length && lastTwo.length < 2) {
    const c = raw[i];
    i += 1;
    if (c && /\d/.test(c)) {
      lastTwo += c;
    }
  }

  const canonical = `${letters}${digit4}${fifth}${lastTwo}`.slice(0, 7);
  if (canonical.length <= 3) return canonical;

  if (/^[A-Z]{3}\d{4}$/.test(canonical)) {
    return `${canonical.slice(0, 3)}-${canonical.slice(3)}`;
  }

  if (isMercosul) {
    return canonical;
  }

  return canonical.replace(/^([A-Z]{3})(\d)/, "$1-$2");
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

  const [plate, setPlate] = useState("");
  const [nickname, setNickname] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  const errors = useMemo(() => {
    const next: string[] = [];

    if (!plate.trim()) next.push("Placa é obrigatória.");
    if (plate.trim() && !isValidPlate(plate)) next.push("Placa inválida. Use AAA-0000 ou AAA0A00.");
    if (!nickname.trim()) next.push("Nome/apelido é obrigatório.");
    if (!model.trim()) next.push("Modelo é obrigatório.");

    const parsedYear = Number.parseInt(year, 10);
    if (!year.trim() || Number.isNaN(parsedYear)) next.push("Ano é obrigatório.");

    const parsedKm = Number.parseInt(currentKm, 10);
    if (!currentKm.trim() || Number.isNaN(parsedKm) || parsedKm <= 0) {
      next.push("Km atual deve ser um número positivo.");
    }

    return next;
  }, [plate, nickname, model, year, currentKm]);

  const isSubmitDisabled = errors.length > 0;

  async function handleCreateVehicle() {
    const nextErrors = errors;
    if (nextErrors.length > 0) {
      Alert.alert("Não foi possível cadastrar", nextErrors[0]);
      return;
    }

    try {
      const parsedYear = Number.parseInt(year, 10);
      const parsedKm = Number.parseInt(currentKm, 10);

      await addVehicle({
        id: `vehicle-${Date.now()}`,
        nickname: nickname.trim(),
        model: model.trim(),
        year: parsedYear,
        plate: formatPlate(plate),
        currentKm: parsedKm,
      });

      setPlate("");
      setNickname("");
      setModel("");
      setYear("");
      setCurrentKm("");
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

      <View className="gap-3 rounded-xl bg-surface p-4">
        <Text className="font-jakarta text-lg font-bold text-text">Cadastrar veículo</Text>

        <View className="gap-2">
          <Text className="font-jakarta text-sm font-semibold text-text">Placa</Text>
          <TextInput
            value={plate}
            onChangeText={(v) => {
              setPlate(formatPlateInput(v));
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

        {successMessage ? (
          <Text className="font-jakarta text-sm font-semibold text-green-600">
            {successMessage}
          </Text>
        ) : null}
      </View>

      {vehicles.map((vehicle) => (
        <Link href={{ pathname: "/vehicle/[id]", params: { id: vehicle.id } }} key={vehicle.id}>
          <VehicleCard vehicle={vehicle} />
        </Link>
      ))}
    </ScrollView>
  );
}
