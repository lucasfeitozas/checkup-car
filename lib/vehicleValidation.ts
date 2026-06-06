import { MAX_VEHICLES_PER_USER } from "@/store/vehicleStore";
import type {
  NewVehicleInput,
  Vehicle,
  VehicleListItem,
  VehicleValidationError,
} from "@/store/vehicleStore";

export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPlate(value: string): string {
  const normalized = normalizePlate(value);

  if (/^[A-Z]{3}\d{4}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(normalized)) {
    return normalized;
  }

  return normalized;
}

export function isValidBrazilianPlate(value: string): boolean {
  const normalized = normalizePlate(value);
  return /^[A-Z]{3}\d{4}$/.test(normalized) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(normalized);
}

export function validateNewVehicleInput(
  input: Partial<NewVehicleInput>,
  currentVehicles: Vehicle[],
): VehicleValidationError[] {
  const errors: VehicleValidationError[] = [];
  const normalizedPlate = normalizePlate(input.plate ?? "");

  if (!normalizedPlate) {
    errors.push({ field: "plate", message: "Placa é obrigatória." });
  } else if (!isValidBrazilianPlate(input.plate ?? "")) {
    errors.push({ field: "plate", message: "Placa inválida. Use AAA-0000 ou AAA0A00." });
  }

  if (!input.nickname?.trim()) {
    errors.push({ field: "nickname", message: "Nome/apelido é obrigatório." });
  } else if (input.nickname.trim().length > 50) {
    errors.push({ field: "nickname", message: "Apelido deve ter no máximo 50 caracteres." });
  }

  if (!input.model?.trim()) {
    errors.push({ field: "model", message: "Modelo é obrigatório." });
  } else if (input.model.trim().length > 100) {
    errors.push({ field: "model", message: "Modelo deve ter no máximo 100 caracteres." });
  }

  if (!input.year || input.year < 1900 || input.year > new Date().getFullYear()) {
    errors.push({ field: "year", message: "Ano deve estar entre 1900 e o ano atual." });
  }

  if (input.currentKm === undefined || input.currentKm === null || Number.isNaN(input.currentKm)) {
    errors.push({
      field: "currentKm",
      message: "Km atual deve ser um número maior ou igual a zero.",
    });
  } else if (input.currentKm < 0) {
    errors.push({
      field: "currentKm",
      message: "Km atual deve ser um número maior ou igual a zero.",
    });
  }

  if (input.brand?.trim() && input.brand.trim().length > 100) {
    errors.push({ field: "brand", message: "Marca deve ter no máximo 100 caracteres." });
  }

  if (currentVehicles.length >= MAX_VEHICLES_PER_USER) {
    errors.push({
      field: "limit",
      message: `Você atingiu o limite máximo de ${MAX_VEHICLES_PER_USER} veículos.`,
    });
  }

  if (normalizedPlate && currentVehicles.some((v) => normalizePlate(v.plate) === normalizedPlate)) {
    errors.push({ field: "plate", message: "Placa já cadastrada." });
  }

  return errors;
}

export function buildVehicleDescription(vehicle: VehicleListItem): string {
  return [vehicle.brand, vehicle.model, String(vehicle.year)].filter(Boolean).join(" ");
}
