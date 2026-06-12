import { calculateCustomMaintenanceSchedule } from "@/features/vehicles/rules/maintenanceEvents";

export type MaintenanceExecutionValidationInput = {
  executionKm: number;
  executionDate: Date;
  currentKm: number;
  value?: number;
};

export type MaintenanceExecutionValidationResult =
  | { isValid: true }
  | { isValid: false; message: string };

export type MaintenanceExecutionScheduleInput = {
  executionKm: number;
  executionDate: Date;
  intervalKm?: number;
  intervalMonths?: number;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function validateMaintenanceExecution({
  executionKm,
  executionDate,
  currentKm,
  value,
}: MaintenanceExecutionValidationInput): MaintenanceExecutionValidationResult {
  if (!Number.isInteger(executionKm) || executionKm < 0) {
    return { isValid: false, message: "Informe uma km de execução válida." };
  }

  if (executionKm > currentKm) {
    return { isValid: false, message: "Km de execução não pode ser maior que a km atual." };
  }

  if (Number.isNaN(executionDate.getTime())) {
    return { isValid: false, message: "Informe uma data de execução válida." };
  }

  if (startOfUtcDay(executionDate).getTime() > startOfUtcDay(new Date()).getTime()) {
    return { isValid: false, message: "Data de execução não pode estar no futuro." };
  }

  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    return { isValid: false, message: "Informe um valor pago válido." };
  }

  return { isValid: true };
}

export function calculateScheduleAfterExecution({
  executionKm,
  executionDate,
  intervalKm,
  intervalMonths,
}: MaintenanceExecutionScheduleInput) {
  return calculateCustomMaintenanceSchedule({
    intervalKm,
    intervalMonths,
    lastExecutionKm: executionKm,
    lastExecutionDate: executionDate,
  });
}
