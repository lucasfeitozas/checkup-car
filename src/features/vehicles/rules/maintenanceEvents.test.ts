import {
  calculateMaintenanceSchedule,
  formatBrazilianDateInput,
  MAINTENANCE_EVENT_TYPES,
  maskBrazilianDateInput,
  validateBrazilianFutureDateInput,
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
});
