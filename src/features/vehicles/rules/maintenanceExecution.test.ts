import {
  calculateScheduleAfterExecution,
  validateMaintenanceExecution,
} from "@/features/vehicles/rules/maintenanceExecution";

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
});
