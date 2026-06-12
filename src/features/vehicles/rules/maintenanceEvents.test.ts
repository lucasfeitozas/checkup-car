import {
  calculateCustomMaintenanceSchedule,
  calculateMaintenanceSchedule,
  formatBrazilianDateInput,
  MAINTENANCE_EVENT_TYPES,
  maskBrazilianDateInput,
  normalizeMaintenanceName,
  normalizeMaintenanceNameForComparison,
  validateBrazilianPastOrTodayDateInput,
  validateBrazilianFutureDateInput,
  validateCustomMaintenanceInput,
} from "@/features/vehicles/rules/maintenanceEvents";

describe("maintenanceEvents", () => {
  it("keeps predefined types sorted alphabetically", () => {
    const names = MAINTENANCE_EVENT_TYPES.map((type) => type.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));

    expect(names).toEqual(sortedNames);
  });

  it("calculates the next km from the current vehicle km", () => {
    expect(calculateMaintenanceSchedule("spark-plugs", 42000)).toMatchObject({
      nextKm: 52000,
    });
  });

  it("calculates the next date from the current date", () => {
    expect(
      calculateMaintenanceSchedule("wiper-blades", 42000, new Date("2026-06-10T12:00:00.000Z")),
    ).toEqual({
      nextDate: "2027-06-10T12:00:00.000Z",
    });
  });

  it("uses the lowest km from interval ranges as the conservative default", () => {
    expect(calculateMaintenanceSchedule("air-filter", 42000)).toMatchObject({
      nextKm: 62000,
    });
    expect(calculateMaintenanceSchedule("suspension", 42000)).toMatchObject({
      nextKm: 82000,
    });
  });

  it("does not calculate automatic values for oil filter", () => {
    expect(calculateMaintenanceSchedule("oil-filter", 42000)).toEqual({});
  });

  it("does not require automatic values for custom events", () => {
    expect(calculateMaintenanceSchedule("custom", 42000)).toEqual({});
  });

  it("calculates custom schedules by km, month or both", () => {
    expect(
      calculateCustomMaintenanceSchedule({
        intervalKm: 10000,
        lastExecutionKm: 42000,
      }),
    ).toEqual({ nextKm: 52000, nextDate: undefined });
    expect(
      calculateCustomMaintenanceSchedule({
        intervalMonths: 6,
        lastExecutionDate: new Date("2026-01-10T12:00:00.000Z"),
      }),
    ).toEqual({ nextKm: undefined, nextDate: "2026-07-10T12:00:00.000Z" });
    expect(
      calculateCustomMaintenanceSchedule({
        intervalKm: 10000,
        intervalMonths: 6,
        lastExecutionKm: 42000,
        lastExecutionDate: new Date("2026-01-10T12:00:00.000Z"),
      }),
    ).toEqual({ nextKm: 52000, nextDate: "2026-07-10T12:00:00.000Z" });
  });

  it("clamps custom monthly schedules to the end of the month", () => {
    expect(
      calculateCustomMaintenanceSchedule({
        intervalMonths: 1,
        lastExecutionDate: new Date("2026-01-31T12:00:00.000Z"),
      }),
    ).toEqual({ nextKm: undefined, nextDate: "2026-02-28T12:00:00.000Z" });
  });

  it("normalizes custom maintenance names", () => {
    expect(normalizeMaintenanceName("  Troca   Especial  ")).toBe("Troca Especial");
    expect(normalizeMaintenanceNameForComparison("  TROCA   Especial ")).toBe("troca especial");
  });

  it("validates custom maintenance intervals and execution bases", () => {
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        currentKm: 42000,
      }),
    ).toEqual({
      isValid: false,
      message: "Informe um intervalo em km, em meses ou ambos.",
    });
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        intervalKm: 0,
        lastExecutionKm: 40000,
        currentKm: 42000,
      }),
    ).toMatchObject({ isValid: false });
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        intervalKm: 10000,
        currentKm: 42000,
      }),
    ).toEqual({ isValid: false, message: "Informe uma última km válida." });
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        intervalKm: 10000,
        lastExecutionKm: 43000,
        currentKm: 42000,
      }),
    ).toMatchObject({ isValid: false });
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        intervalMonths: 6,
        currentKm: 42000,
      }),
    ).toEqual({ isValid: false, message: "Informe a data da última execução." });
    expect(
      validateCustomMaintenanceInput({
        name: "Revisão especial",
        intervalKm: 10000,
        intervalMonths: 6,
        lastExecutionKm: 42000,
        lastExecutionDate: new Date("2025-06-10T12:00:00.000Z"),
        currentKm: 42000,
      }),
    ).toEqual({ isValid: true });
  });

  it("formats calculated dates as Brazilian input dates", () => {
    expect(formatBrazilianDateInput("2027-06-10T12:00:00.000Z")).toBe("10/06/2027");
  });

  it("masks date input as DD/MM/YYYY", () => {
    expect(maskBrazilianDateInput("10062027")).toBe("10/06/2027");
    expect(maskBrazilianDateInput("10/06/2027")).toBe("10/06/2027");
    expect(maskBrazilianDateInput("10062027123")).toBe("10/06/2027");
  });

  it("validates Brazilian dates strictly", () => {
    expect(
      validateBrazilianFutureDateInput("31/02/2027", new Date("2026-06-10T12:00:00.000Z")),
    ).toEqual({
      isValid: false,
      message: "Informe uma data limite válida.",
    });
  });

  it("rejects dates before today", () => {
    expect(
      validateBrazilianFutureDateInput("09/06/2026", new Date("2026-06-10T12:00:00.000Z")),
    ).toEqual({
      isValid: false,
      message: "Data limite não pode ser anterior à data atual.",
    });
  });

  it("accepts today and future dates", () => {
    expect(
      validateBrazilianFutureDateInput("10/06/2026", new Date("2026-06-10T12:00:00.000Z")),
    ).toMatchObject({
      isValid: true,
      date: new Date("2026-06-10T12:00:00.000Z"),
    });
    expect(
      validateBrazilianFutureDateInput("11/06/2026", new Date("2026-06-10T12:00:00.000Z")),
    ).toMatchObject({
      isValid: true,
      date: new Date("2026-06-11T12:00:00.000Z"),
    });
  });

  it("accepts past dates and rejects future dates for the last execution", () => {
    expect(
      validateBrazilianPastOrTodayDateInput("09/06/2026", new Date("2026-06-10T12:00:00.000Z")),
    ).toMatchObject({ isValid: true });
    expect(
      validateBrazilianPastOrTodayDateInput("11/06/2026", new Date("2026-06-10T12:00:00.000Z")),
    ).toEqual({
      isValid: false,
      message: "Última execução não pode estar no futuro.",
    });
  });
});
