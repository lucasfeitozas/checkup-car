import {
  calculateMaintenanceExecutionHistorySummary,
  calculateScheduleAfterExecution,
  sortMaintenanceExecutionsChronologically,
  validateMaintenanceExecution,
} from "@/features/vehicles/rules/maintenanceExecution";
import type { MaintenanceExecution } from "@/features/vehicles/stores/vehicleStore";

describe("maintenanceExecution", () => {
  it("recalculates the next maintenance schedule from the execution", () => {
    expect(
      calculateScheduleAfterExecution({
        executionKm: 50000,
        executionDate: new Date("2026-06-10T12:00:00.000Z"),
        intervalKm: 10000,
        intervalMonths: 6,
      }),
    ).toEqual({
      nextKm: 60000,
      nextDate: "2026-12-10T12:00:00.000Z",
    });
  });

  it("validates required execution data", () => {
    expect(
      validateMaintenanceExecution({
        executionKm: Number.NaN,
        executionDate: new Date("2026-06-10T12:00:00.000Z"),
        currentKm: 50000,
      }),
    ).toEqual({ isValid: false, message: "Informe uma km de execução válida." });

    expect(
      validateMaintenanceExecution({
        executionKm: 50000,
        executionDate: new Date("invalid"),
        currentKm: 50000,
      }),
    ).toEqual({ isValid: false, message: "Informe uma data de execução válida." });
  });

  it("rejects execution km above the current vehicle km", () => {
    expect(
      validateMaintenanceExecution({
        executionKm: 50001,
        executionDate: new Date("2026-06-10T12:00:00.000Z"),
        currentKm: 50000,
      }),
    ).toEqual({
      isValid: false,
      message: "Km de execução não pode ser maior que a km atual.",
    });
  });

  it("rejects negative values", () => {
    expect(
      validateMaintenanceExecution({
        executionKm: 50000,
        executionDate: new Date("2026-06-10T12:00:00.000Z"),
        currentKm: 50000,
        value: -1,
      }),
    ).toEqual({ isValid: false, message: "Informe um valor pago válido." });
  });

  it("sorts executions chronologically and summarizes paid value and average intervals", () => {
    const executions: MaintenanceExecution[] = [
      {
        id: "execution-2",
        vehicleEventId: "maintenance-1",
        executionKm: 50000,
        executionDate: "2026-06-10T12:00:00.000Z",
        value: 300,
      },
      {
        id: "execution-1",
        vehicleEventId: "maintenance-1",
        executionKm: 40000,
        executionDate: "2026-01-10T12:00:00.000Z",
        value: 250,
      },
      {
        id: "execution-3",
        vehicleEventId: "maintenance-1",
        executionKm: 61000,
        executionDate: "2026-12-10T12:00:00.000Z",
      },
    ];

    expect(
      sortMaintenanceExecutionsChronologically(executions).map((execution) => execution.id),
    ).toEqual(["execution-1", "execution-2", "execution-3"]);
    expect(calculateMaintenanceExecutionHistorySummary(executions)).toEqual({
      totalPaid: 550,
      averageKmInterval: 10500,
      averageDaysInterval: 167,
    });
  });
});
