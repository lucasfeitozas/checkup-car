import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal } from "react-native";
import { styled } from "styled-components/native";

import { VehicleCard } from "@/features/vehicles/components/VehicleCard";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components/common/Button";
import { AppText, Column, Screen, SectionTitle, Surface } from "@/components/common/styled";
import { MAX_VEHICLES_PER_USER, useVehicleStore } from "@/features/vehicles/stores/vehicleStore";
import {
  formatPlate,
  normalizePlate,
  validateNewVehicleInput,
} from "@/features/vehicles/rules/vehicleValidation";

function formatPlateInput(value: string): string {
  return formatPlate(normalizePlate(value).slice(0, 7));
}

const Actions = styled(Column)`
  gap: 8px;
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
  height: 92%;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  background-color: ${({ theme }) => theme.background};
`;

const SheetHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled.Pressable`
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
  padding: 8px 12px;
`;

const FormScroll = styled.ScrollView.attrs({
  contentContainerStyle: { gap: 12, paddingBottom: 16 },
  keyboardShouldPersistTaps: "handled" as const,
})`
  flex: 1;
  margin-top: 16px;
`;

const Field = styled(Column)`
  gap: 8px;
`;

const FieldInput = styled.TextInput<{ $hasError: boolean }>`
  min-height: 48px;
  border-radius: 8px;
  border-width: 1px;
  padding: 0 16px;
  background-color: ${({ theme }) => theme.background};
  border-color: ${({ $hasError, theme }) => ($hasError ? theme.primary : theme.border)};
  color: ${({ theme }) => theme.text};
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

export default function VehiclesScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
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
    <Screen style={{ backgroundColor: isDark ? "#353935" : "#ECEFF1" }}>
      <Column $gap={4}>
        <SectionTitle>Veículos</SectionTitle>
        <AppText $color="muted" $size={16}>
          Gerencie sua frota.
        </AppText>
      </Column>

      <Actions>
        <Button
          title={isLimitReached ? "Limite atingido" : "Adicionar veículo"}
          onPress={() => {
            setSuccessMessage(null);
            setIsCreateOpen(true);
          }}
          disabled={isLimitReached}
        />
        {isLimitReached ? (
          <AppText $color="muted" $weight={600}>
            Você já cadastrou {MAX_VEHICLES_PER_USER} veículos nesta conta.
          </AppText>
        ) : null}
        {successMessage ? (
          <AppText $color="success" $weight={600}>
            {successMessage}
          </AppText>
        ) : null}
      </Actions>

      {!isHydrated ? (
        <AppText $color="muted">Carregando veículos...</AppText>
      ) : vehicles.length === 0 ? (
        <Surface>
          <AppText $size={16} $weight={700}>
            Nenhum veículo cadastrado
          </AppText>
          <AppText $color="muted">Adicione seu primeiro veículo para começar.</AppText>
        </Surface>
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
        <ModalOverlay>
          <Backdrop
            onPress={() => {
              setIsCreateOpen(false);
            }}
          />
          <Sheet>
            <SheetHeader>
              <AppText $size={18} $weight={700}>
                Cadastrar veículo
              </AppText>
              <CloseButton
                onPress={() => {
                  setIsCreateOpen(false);
                }}
                accessibilityLabel="Fechar cadastro de veículo"
                accessibilityRole="button"
              >
                <AppText $weight={700}>Fechar</AppText>
              </CloseButton>
            </SheetHeader>

            <FormScroll>
              <Field>
                <AppText $weight={600}>Placa</AppText>
                <FieldInput
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
                  $hasError={shouldShowFieldError("plate", plate)}
                />
                {shouldShowFieldError("plate", plate) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("plate")}
                  </AppText>
                ) : null}
              </Field>

              <Field>
                <AppText $weight={600}>Nome/apelido</AppText>
                <FieldInput
                  value={nickname}
                  onChangeText={(v) => {
                    setNickname(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Nome ou apelido do veículo"
                  maxLength={50}
                  placeholder="Ex: Meu carro"
                  placeholderTextColor={theme.muted}
                  $hasError={shouldShowFieldError("nickname", nickname)}
                />
                {shouldShowFieldError("nickname", nickname) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("nickname")}
                  </AppText>
                ) : null}
              </Field>

              <Field>
                <AppText $weight={600}>Marca (opcional)</AppText>
                <FieldInput
                  value={brand}
                  onChangeText={(v) => {
                    setBrand(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Marca do veículo"
                  maxLength={100}
                  placeholder="Ex: Toyota"
                  placeholderTextColor={theme.muted}
                  $hasError={shouldShowFieldError("brand", brand)}
                />
                {shouldShowFieldError("brand", brand) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("brand")}
                  </AppText>
                ) : null}
              </Field>

              <Field>
                <AppText $weight={600}>Modelo</AppText>
                <FieldInput
                  value={model}
                  onChangeText={(v) => {
                    setModel(v);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  accessibilityLabel="Modelo do veículo"
                  maxLength={100}
                  placeholder="Ex: Corolla"
                  placeholderTextColor={theme.muted}
                  $hasError={shouldShowFieldError("model", model)}
                />
                {shouldShowFieldError("model", model) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("model")}
                  </AppText>
                ) : null}
              </Field>

              <Field>
                <AppText $weight={600}>Ano</AppText>
                <FieldInput
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
                  $hasError={shouldShowFieldError("year", year)}
                />
                {shouldShowFieldError("year", year) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("year")}
                  </AppText>
                ) : null}
              </Field>

              <Field>
                <AppText $weight={600}>Km atual</AppText>
                <FieldInput
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
                  $hasError={shouldShowFieldError("currentKm", currentKm)}
                />
                {shouldShowFieldError("currentKm", currentKm) ? (
                  <AppText $color="primary" $size={12} $weight={600}>
                    {getFieldError("currentKm")}
                  </AppText>
                ) : null}
              </Field>
            </FormScroll>

            <Footer>
              {firstValidationError ? (
                <AppText $color="primary" $weight={600} style={{ marginBottom: 8 }}>
                  {firstValidationError.message}
                </AppText>
              ) : null}
              <SubmitButton
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitDisabled }}
                disabled={isSubmitDisabled}
                onPress={handleCreateVehicle}
              >
                <AppText $color="white" $size={16} $weight={700}>
                  Cadastrar
                </AppText>
              </SubmitButton>
            </Footer>
          </Sheet>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
