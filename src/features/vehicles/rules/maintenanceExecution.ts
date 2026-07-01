import { calculateCustomMaintenanceSchedule } from "@/features/vehicles/rules/maintenanceEvents";
import type { MaintenanceExecution } from "@/features/vehicles/stores/vehicleStore";

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

export type MaintenanceExecutionHistorySummary = {
  totalPaid: number;
  averageKmInterval?: number;
  averageDaysInterval?: number;
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

export function sortMaintenanceExecutionsChronologically(
  executions: MaintenanceExecution[],
): MaintenanceExecution[] {
  return [...executions].sort(
    (left, right) => Date.parse(left.executionDate) - Date.parse(right.executionDate),
  );
}

export function calculateMaintenanceExecutionHistorySummary(
  executions: MaintenanceExecution[],
): MaintenanceExecutionHistorySummary {
  const orderedExecutions = sortMaintenanceExecutionsChronologically(executions);
  const totalPaid = orderedExecutions.reduce(
    (total, execution) => total + (execution.value ?? 0),
    0,
  );

  if (orderedExecutions.length < 2) {
    return { totalPaid };
  }

  let totalKmInterval = 0;
  let totalDaysInterval = 0;

  for (let index = 1; index < orderedExecutions.length; index += 1) {
    const previous = orderedExecutions[index - 1]!;
    const current = orderedExecutions[index]!;
    totalKmInterval += Math.abs(current.executionKm - previous.executionKm);
    totalDaysInterval += Math.abs(
      Date.parse(current.executionDate) - Date.parse(previous.executionDate),
    );
  }

  const intervalCount = orderedExecutions.length - 1;

  return {
    totalPaid,
    averageKmInterval: Math.round(totalKmInterval / intervalCount),
    averageDaysInterval: Math.round(totalDaysInterval / intervalCount / 86_400_000),
  };
}
