import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { VehicleCard } from "@/components/features/VehicleCard";
import { useAppTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { MAX_VEHICLES_PER_USER, useVehicleStore } from "@/store/vehicleStore";
import { formatPlate, normalizePlate, validateNewVehicleInput } from "@/lib/vehicleValidation";

function formatPlateInput(value: string): string {
  return formatPlate(normalizePlate(value).slice(0, 7));
}

export default function VehiclesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
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

  const validationErrors = useMemo(() => {
    const parsedYear = Number.parseInt(year, 10);
    const parsedKm = Number.parseInt(currentKm, 10);

    return validateNewVehicleInput(
      {
        plate,
        nickname,
        brand,
        model,
        year: Number.isNaN(parsedYear) ? undefined : parsedYear,
        currentKm: Number.isNaN(parsedKm) ? undefined : parsedKm,
      },
      vehicles,
    );
  }, [brand, currentKm, model, nickname, plate, vehicles, year]);

  const isSubmitDisabled = validationErrors.length > 0;
  const firstValidationError = validationErrors[0];

  function getFieldError(field: string): string | undefined {
    return validationErrors.find((error) => error.field === field)?.message;
  }

  function inputClassName(): string {
    return "min-h-12 rounded-lg border px-4";
  }

  function inputStyle(hasError: boolean) {
    return {
      backgroundColor: theme.background,
      borderColor: hasError ? theme.primary : theme.border,
      color: theme.text,
    };
  }

  function shouldShowFieldError(field: string, value: string): boolean {
    const error = getFieldError(field);
    return Boolean(error && (value.trim().length > 0 || firstValidationError?.field === field));
  }

  function resetForm() {
    setPlate("");
    setNickname("");
    setBrand("");
    setModel("");
    setYear("");
    setCurrentKm("");
  }

  async function handleCreateVehicle() {
    if (validationErrors.length > 0) {
      const firstError = validationErrors[0];
      if (firstError) {
        Alert.alert("Não foi possível cadastrar", firstError.message);
      }
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5 pb-32">
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
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onPress={() => {
              router.push({ pathname: "/vehicle/[id]", params: { id: vehicle.id } });
            }}
          />
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
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => {
              setIsCreateOpen(false);
            }}
          />
          <View className="rounded-t-3xl p-5" style={{ backgroundColor: theme.background, height: "92%" }}>
            <View className="flex-row items-center justify-between">
              <Text className="font-jakarta text-lg font-bold text-text">Cadastrar veículo</Text>
              <Pressable
                onPress={() => {
                  setIsCreateOpen(false);
                }}
                className="rounded-lg border px-3 py-2"
                accessibilityLabel="Fechar cadastro de veículo"
                accessibilityRole="button"
                style={{ borderColor: theme.border }}
              >
                <Text className="font-jakarta text-sm font-bold text-text">Fechar</Text>
              </Pressable>
            </View>

            <ScrollView
              className="mt-4 flex-1"
              contentContainerClassName="gap-3 pb-4"
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">Placa</Text>
                <TextInput
                  value={plate}
                  onChangeText={(v) => {
                    setPlate(formatPlateInput(v));
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityHint="Use o formato antigo AAA-0000 ou o formato Mercosul AAA0A00."
                  accessibilityLabel="Placa do veículo"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  placeholder="AAA-0000 ou AAA0A00"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("plate", plate))}
                />
                {shouldShowFieldError("plate", plate) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("plate")}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">Nome/apelido</Text>
                <TextInput
                  value={nickname}
                  onChangeText={(v) => {
                    setNickname(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Nome ou apelido do veículo"
                  maxLength={50}
                  placeholder="Ex: Meu carro"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("nickname", nickname))}
                />
                {shouldShowFieldError("nickname", nickname) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("nickname")}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">
                  Marca (opcional)
                </Text>
                <TextInput
                  value={brand}
                  onChangeText={(v) => {
                    setBrand(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Marca do veículo"
                  maxLength={100}
                  placeholder="Ex: Toyota"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("brand", brand))}
                />
                {shouldShowFieldError("brand", brand) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("brand")}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">Modelo</Text>
                <TextInput
                  value={model}
                  onChangeText={(v) => {
                    setModel(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Modelo do veículo"
                  maxLength={100}
                  placeholder="Ex: Corolla"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("model", model))}
                />
                {shouldShowFieldError("model", model) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("model")}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">Ano</Text>
                <TextInput
                  value={year}
                  onChangeText={(v) => {
                    setYear(v.replace(/\D/g, "").slice(0, 4));
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityHint="Informe um ano entre 1900 e o ano atual."
                  accessibilityLabel="Ano do veículo"
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="Ex: 2022"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("year", year))}
                />
                {shouldShowFieldError("year", year) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("year")}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="font-jakarta text-sm font-semibold text-text">Km atual</Text>
                <TextInput
                  value={currentKm}
                  onChangeText={(v) => {
                    setCurrentKm(v.replace(/\D/g, "").slice(0, 9));
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityHint="Informe somente números. Zero é aceito para veículos sem uso registrado."
                  accessibilityLabel="Quilometragem atual do veículo"
                  keyboardType="number-pad"
                  maxLength={9}
                  placeholder="Ex: 42000"
                  placeholderTextColor={theme.muted}
                  className={inputClassName()}
                  style={inputStyle(shouldShowFieldError("currentKm", currentKm))}
                />
                {shouldShowFieldError("currentKm", currentKm) ? (
                  <Text
                    className="font-jakarta text-xs font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {getFieldError("currentKm")}
                  </Text>
                ) : null}
              </View>

            </ScrollView>

            <View
              className="border-t pt-3"
              style={{ backgroundColor: theme.background, borderTopColor: theme.border }}
            >
              {firstValidationError ? (
                <Text
                  className="font-jakarta mb-2 text-sm font-semibold"
                  style={{ color: theme.primary }}
                >
                  {firstValidationError.message}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitDisabled }}
                className="min-h-12 items-center justify-center rounded-lg px-5"
                disabled={isSubmitDisabled}
                onPress={handleCreateVehicle}
                style={{
                  backgroundColor: theme.primary,
                  opacity: isSubmitDisabled ? 0.5 : 1,
                }}
              >
                <Text className="font-jakarta text-base font-bold" style={{ color: "#FFFFFF" }}>
                  Cadastrar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
